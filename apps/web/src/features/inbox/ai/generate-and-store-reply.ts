/**
 * Phase B-2 — inbound 메시지에 대한 AI 응답 초안 생성 및 저장.
 *
 * 책임:
 *   1. messageId로 inbound message 컨텍스트 fetch (conversation/store/customer)
 *   2. boundary 검증 (storeName 신뢰성, 5턴 상한, 중복 응답 방어)
 *   3. race-safe claim (markAIResponded conditional UPDATE) → generateReply
 *   4. outbound `ai_draft` 메시지로 DB 저장
 *   5. 인박스 UI revalidate
 *
 * IG API 발송은 Phase B-3에서 별 트리거. 응답은 `ai_draft` 상태로 사장 검수 대기.
 *
 * processInbound가 fire-and-forget으로 호출 — Server Action(`"use server"`) 아님.
 * 외부 클라이언트 노출 금지를 위해 server-only 가드 유지.
 *
 * **LLM01 known-limitation**: `recentMessages.text`(고객 inbound 원문)는 sanitize 없이
 * Anthropic API user content로 전달된다. ai_draft 상태로 사장 검수가 강제되므로 자동
 * 발송 위험 X. 자동 발송 도입 시(B-3+) injection 방어 재검토 필요.
 *
 * **Partial success**: generateReply 또는 insert 실패 시 markAIResponded는 이미
 * true → inbound는 영원히 미응답 상태. 재시도 메커니즘 없음 — Sentry capture
 * 모니터링으로 감지·수동 보정 (B-2 design 결정, queue/재시도는 향후 Epic 1C).
 */
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createDbClient, type Channel, type DbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import * as Sentry from "@sentry/nextjs";
import {
  generateReply as defaultGenerateReply,
  type GenerateReplyInput,
  type GenerateReplyOutput,
} from "./generate-reply";
import {
  translateReply as defaultTranslateReply,
  type TranslateReplyInput,
  type TranslateReplyOutput,
} from "./translate-reply";
import {
  generateEmbedding as defaultGenerateEmbedding,
  type EmbeddingResult,
} from "./embeddings";
import type { CustomerLanguage, RelatedFAQ } from "./prompt";
import {
  findMessageById,
  insertMessage,
  listRecentByConversation,
  markAIResponded,
  markTranslated,
} from "@/shared/lib/dal/messages";
import { findStoreNameByConversationId } from "@/shared/lib/dal/stores";
import { getCustomerPreferredLanguage } from "@/shared/lib/dal/customers";
import { searchSimilarKnowledge as defaultSearchSimilarKnowledge } from "@/shared/lib/dal/store-knowledge";

// 모듈 수명 동안 단일 DbClient 유지 — fire-and-forget 동시 호출 폭주 시
// connection pool 누수 방어. 테스트는 deps.db 주입으로 격리되므로 영향 없음.
let cachedDb: DbClient | null = null;
function getDefaultDb(): DbClient {
  if (cachedDb) return cachedDb;
  cachedDb = createDbClient(env.DATABASE_URL);
  return cachedDb;
}

const RECENT_LIMIT = 10; // 5턴 = inbound+outbound 페어 5쌍
const STORE_NAME_MAX = 100;
// LLM 응답 길이 상한. generate-reply MAX_TOKENS=600(한국어 ~1500자)의 ~3x 여유.
// DB 컬럼은 text(무제한)지만 인박스 UI 렌더 비용 + 스팸성 응답 사전 차단.
const MAX_REPLY_CHARS = 5000;
const SUPPORTED_LANGS: ReadonlySet<CustomerLanguage> = new Set([
  "ko",
  "en",
  "zh",
  "ja",
  "vi",
]);

export type SkipReason =
  | "invalid_message_id"
  | "message_not_found"
  | "not_inbound"
  | "no_channel"
  | "already_responded"
  | "no_conversation_id"
  | "no_recent_messages"
  | "no_store_name"
  | "invalid_store_name"
  | "reply_too_long"
  | "insert_failed";

export type GenerateAndStoreReplyDeps = {
  db: DbClient;
  generateReply: (input: GenerateReplyInput) => Promise<GenerateReplyOutput>;
  translateReply: (input: TranslateReplyInput) => Promise<TranslateReplyOutput>;
  /** Phase B-4b RAG — text → 1536d 벡터. */
  generateEmbedding: (input: { text: string }) => Promise<EmbeddingResult>;
  /** Phase B-4b RAG — pgvector cosine similarity 검색. */
  searchSimilarKnowledge: typeof defaultSearchSimilarKnowledge;
};

export type GenerateAndStoreReplyResult =
  | {
      stored: true;
      aiMessageId: string;
      tokensUsed: { input: number; output: number };
    }
  | { stored: false; reason: SkipReason };

function normalizeLanguage(raw: string | null): CustomerLanguage {
  if (raw && SUPPORTED_LANGS.has(raw as CustomerLanguage)) {
    return raw as CustomerLanguage;
  }
  return "ko";
}

/**
 * Production은 `deps` 생략 — default db(lazy singleton) + default
 * generateReply/translateReply가 주입됨. 테스트만 deps로 격리.
 */
export async function generateAndStoreReply(
  messageId: string,
  deps: Partial<GenerateAndStoreReplyDeps> = {},
): Promise<GenerateAndStoreReplyResult> {
  const idCheck = z.string().uuid().safeParse(messageId);
  if (!idCheck.success) {
    return { stored: false, reason: "invalid_message_id" };
  }

  const db = deps.db ?? getDefaultDb();
  const gen = deps.generateReply ?? defaultGenerateReply;
  const translate = deps.translateReply ?? defaultTranslateReply;
  const embed = deps.generateEmbedding ?? defaultGenerateEmbedding;
  const searchKB = deps.searchSimilarKnowledge ?? defaultSearchSimilarKnowledge;

  const msg = await findMessageById(db, idCheck.data);
  if (!msg) return { stored: false, reason: "message_not_found" };
  if (msg.direction !== "inbound") {
    return { stored: false, reason: "not_inbound" };
  }
  if (msg.aiResponded) {
    return { stored: false, reason: "already_responded" };
  }
  if (!msg.conversationId) {
    return { stored: false, reason: "no_conversation_id" };
  }
  // schema 상 channel은 nullable text. webhook은 항상 enum 값을 set하지만
  // 레거시/수동 insert에 대비해 명시 skip — 무조건 "instagram" fallback 금지.
  if (!msg.channel) {
    return { stored: false, reason: "no_channel" };
  }

  const recent = await listRecentByConversation(
    db,
    msg.conversationId,
    RECENT_LIMIT,
  );
  if (recent.length === 0) {
    return { stored: false, reason: "no_recent_messages" };
  }

  const rawStoreName = await findStoreNameByConversationId(
    db,
    msg.conversationId,
  );
  if (!rawStoreName) {
    return { stored: false, reason: "no_store_name" };
  }
  const storeName = rawStoreName.trim();
  if (storeName.length === 0 || storeName.length > STORE_NAME_MAX) {
    return { stored: false, reason: "invalid_store_name" };
  }

  // customerId UUID 검증 후 language 조회. 비-UUID는 schema 정합성 오류이지만
  // 'ko' fallback으로 진행 (개별 메시지로 전체 흐름 차단 안 함, 운영 모니터링).
  const customerIdValid =
    !!msg.customerId && z.string().uuid().safeParse(msg.customerId).success;
  const langRaw = customerIdValid
    ? await getCustomerPreferredLanguage(db, msg.customerId!)
    : null;
  const customerLanguage = normalizeLanguage(langRaw);

  const recentMessages = recent
    .filter(
      (m): m is typeof m & { originalText: string; direction: string } =>
        Boolean(m.originalText) && m.direction !== null,
    )
    .map((m) => ({
      direction:
        m.direction === "outbound"
          ? ("outbound" as const)
          : ("inbound" as const),
      text: m.originalText,
    }));

  // Race-safe claim: conditional UPDATE (WHERE ai_responded=false). 동시 호출 시
  // 한 호출만 true 반환 — generateReply/insert 비용을 한 번만 부담. partial
  // success(generateReply 또는 insert 실패) 시 inbound는 영원히 미응답 상태로 남으며
  // 운영 모니터링(Sentry) 책임 (B-2 design 결정).
  const claimed = await markAIResponded(db, msg.id);
  if (!claimed) {
    return { stored: false, reason: "already_responded" };
  }

  // B-4b RAG — inbound 메시지 임베딩 + 매장 FAQ 검색. 실패 silent skip
  // (RAG 없이 기존 흐름 진행). Sentry tag로 단계 구분 (embedding vs search).
  //
  // skip 조건:
  //   - storeId/originalText 없는 레거시 메시지 → 정상 skip
  //   - 3000자 초과 (embeddings.MAX_INPUT_CHARS) → 정상 skip (Sec DoS 방어,
  //     Sentry 미발생; 긴 메시지는 RAG 없이 진행이 정상 경로)
  // storeId는 Sentry extra에 8자만 (전체 식별자 노출 회피).
  let relatedFAQs: RelatedFAQ[] | undefined;
  if (msg.storeId && msg.originalText && msg.originalText.length <= 3000) {
    const storeIdShort = msg.storeId.slice(0, 8);
    try {
      const embedded = await embed({ text: msg.originalText });
      try {
        const hits = await searchKB(db, msg.storeId, embedded.embedding, {
          k: 3,
        });
        relatedFAQs = hits.map((h) => ({
          question: h.question,
          answer: h.answer,
        }));
      } catch (searchErr) {
        Sentry.captureException(searchErr, {
          tags: { phase: "searchSimilarKnowledge" },
          extra: { messageId: msg.id, storeIdShort },
        });
      }
    } catch (embeddingErr) {
      Sentry.captureException(embeddingErr, {
        tags: { phase: "embedding" },
        extra: { messageId: msg.id, storeIdShort },
      });
    }
  }

  const result = await gen({
    storeName,
    customerLanguage,
    recentMessages,
    relatedFAQs,
  });
  if (result.reply.length > MAX_REPLY_CHARS) {
    return { stored: false, reason: "reply_too_long" };
  }

  // channel은 위 가드를 통과했으므로 non-null. DB CHECK 제약이 enum 값을
  // 강제하므로 cast 안전 (`send-outbound.ts`와 동일 패턴).
  const channel = msg.channel as Channel;
  // Epic 1B-Tone-3 + Phase 2-A: tones/verifications metadata에 통합 저장.
  // - tones 없으면 metadata 자체 생략 (1A/1B 호환).
  // - tones만 있고 verifications 없으면 verifications 키 자체 생략 (Phase 1 호환).
  // originalText는 default tone(warm).
  const metadata = result.tones
    ? {
        tones: result.tones,
        ...(result.verifications
          ? { verifications: result.verifications }
          : {}),
      }
    : undefined;
  const stored = await insertMessage(db, {
    conversationId: msg.conversationId,
    channel,
    direction: "outbound",
    originalText: result.reply,
    status: "ai_draft",
    ...(metadata ? { metadata } : {}),
  });
  if (!stored) {
    return { stored: false, reason: "insert_failed" };
  }

  // B-3a 자동 번역. customerLanguage가 'ko'이면 translateReply 자체가 no-op이지만
  // markTranslated 호출도 불필요하므로 caller에서 분기. 번역/저장 실패는 silent skip
  // (한국어 ai_draft는 살아있어 사장이 한국어로 검수 후 수동 처리 가능).
  // try-catch는 의도적으로 분리 — translate vs markTranslated 에러를 Sentry tag로
  // 구분해 진단을 명확히 (B-3a review code MED).
  if (customerLanguage !== "ko") {
    let translated: TranslateReplyOutput | null = null;
    try {
      translated = await translate({
        koreanText: result.reply,
        targetLanguage: customerLanguage,
      });
      // 번역 출력 길이 가드 — generate-reply MAX_REPLY_CHARS의 1.5x.
      // 일본어/중국어 번역이 한국어 입력보다 길어질 수 있어 여유 적용.
      if (translated.translatedText.length > MAX_REPLY_CHARS * 1.5) {
        Sentry.captureException(new Error("translatedText too long"), {
          tags: { phase: "translateReply" },
          extra: {
            aiMessageId: stored.id,
            targetLanguage: customerLanguage,
            inputLength: result.reply.length,
            translatedLength: translated.translatedText.length,
          },
        });
        translated = null; // markTranslated 호출 안 함
      }
    } catch (translationErr) {
      Sentry.captureException(translationErr, {
        tags: { phase: "translateReply" },
        extra: {
          aiMessageId: stored.id,
          targetLanguage: customerLanguage,
          inputLength: result.reply.length,
        },
      });
    }

    if (translated) {
      try {
        await markTranslated(db, stored.id, {
          translatedText: translated.translatedText,
          languageTo: customerLanguage,
        });
      } catch (writeErr) {
        Sentry.captureException(writeErr, {
          tags: { phase: "markTranslated" },
          extra: { aiMessageId: stored.id, targetLanguage: customerLanguage },
        });
      }
    }
  }

  revalidatePath("/[locale]/store/inbox", "page");

  return {
    stored: true,
    aiMessageId: stored.id,
    tokensUsed: result.tokensUsed,
  };
}
