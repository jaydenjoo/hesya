/**
 * Phase B-2 — inbound 메시지에 대한 AI 응답 초안 생성 및 저장.
 *
 * 책임:
 *   1. messageId로 inbound message 컨텍스트 fetch (conversation/store/customer)
 *   2. boundary 검증 (storeName 신뢰성, 5턴 상한, 중복 응답 방어)
 *   3. B-1 generateReply 호출
 *   4. outbound `ai_draft` 메시지로 DB 저장
 *   5. inbound에 aiResponded=true 마킹
 *   6. 인박스 UI revalidate
 *
 * IG API 발송은 Phase B-3에서 별 트리거.
 *
 * processInbound가 fire-and-forget으로 호출 — Server Action(`"use server"`) 아님.
 * 외부 클라이언트 노출 금지를 위해 server-only 가드 유지.
 */
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createDbClient, type Channel, type DbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import {
  generateReply as defaultGenerateReply,
  type GenerateReplyInput,
  type GenerateReplyOutput,
} from "./generate-reply";
import type { CustomerLanguage } from "./prompt";
import {
  findMessageById,
  insertMessage,
  listRecentByConversation,
  markAIResponded,
} from "@/shared/lib/dal/messages";
import { findStoreNameByConversationId } from "@/shared/lib/dal/stores";
import { getCustomerPreferredLanguage } from "@/shared/lib/dal/customers";

const RECENT_LIMIT = 10; // 5턴 = inbound+outbound 페어 5쌍
const STORE_NAME_MAX = 100;
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
  | "already_responded"
  | "no_conversation_id"
  | "no_recent_messages"
  | "no_store_name"
  | "invalid_store_name"
  | "insert_failed";

export type GenerateAndStoreReplyDeps = {
  db: DbClient;
  generateReply: (input: GenerateReplyInput) => Promise<GenerateReplyOutput>;
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

export async function generateAndStoreReply(
  messageId: string,
  deps: Partial<GenerateAndStoreReplyDeps> = {},
): Promise<GenerateAndStoreReplyResult> {
  const idCheck = z.string().uuid().safeParse(messageId);
  if (!idCheck.success) {
    return { stored: false, reason: "invalid_message_id" };
  }

  const db = deps.db ?? createDbClient(env.DATABASE_URL);
  const gen = deps.generateReply ?? defaultGenerateReply;

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

  const langRaw = msg.customerId
    ? await getCustomerPreferredLanguage(db, msg.customerId)
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

  const result = await gen({
    storeName,
    customerLanguage,
    recentMessages,
  });

  const channel = (msg.channel ?? "instagram") as Channel;
  const stored = await insertMessage(db, {
    conversationId: msg.conversationId,
    channel,
    direction: "outbound",
    originalText: result.reply,
    status: "ai_draft",
  });
  if (!stored) {
    return { stored: false, reason: "insert_failed" };
  }

  await markAIResponded(db, msg.id);
  revalidatePath("/[locale]/store/inbox", "page");

  return {
    stored: true,
    aiMessageId: stored.id,
    tokensUsed: result.tokensUsed,
  };
}
