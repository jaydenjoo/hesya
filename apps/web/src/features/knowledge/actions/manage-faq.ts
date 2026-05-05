/**
 * Phase B-4c — 매장 FAQ CRUD Server Actions.
 *
 * 사장이 매장 FAQ(질문/답변)를 등록·수정·삭제. 등록·수정 시 OpenAI
 * text-embedding-3-small로 임베딩(1536d) 자동 재생성. inbound 메시지 도착
 * 시 RAG 검색 대상이 됨 (B-4b generate-and-store-reply).
 *
 * **임베딩 입력**: `질문\n답변` 합쳐서 1회 호출. 질문/답변 따로 임베딩하면
 * 검색 정확도 ↑이지만 비용 ↑. MVP는 단순 합침.
 *
 * **임베딩 실패 정책**: silent skip (embedding=null로 insert) — 사장 입장
 * 에서 FAQ 등록 자체는 성공해야 UX 끊기지 않음. embedding=null인 row는
 * 검색에서 IS NOT NULL 가드로 제외됨 (검색 결과에 안 나옴 = RAG 사각지대).
 * 다음 수정 시 재시도. 운영 모니터링: Sentry tag 'phase: faq_embedding'.
 *
 * **에러 메시지 통합 (L-061)**: ownership 불일치 / 미존재 모두 동일 메시지
 * ("요청을 처리할 수 없습니다") — enumeration 벡터 차단.
 *
 * **count 한도 (Sec-LOW-1)**: 매장당 200개. createFAQ 진입 시 list로 체크.
 * vector DoS + ivfflat lists=100 적합 범위 보호.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import * as Sentry from "@sentry/nextjs";
import { captureServerActionError } from "@/instrumentation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  createStoreKnowledge,
  updateStoreKnowledge,
  deleteStoreKnowledge,
  listStoreKnowledge,
} from "@/shared/lib/dal/store-knowledge";
import { generateEmbedding } from "@/features/inbox/ai/embeddings";
import { ValidationError } from "@/shared/lib/errors";
import {
  createFAQInputSchema,
  updateFAQInputSchema,
  deleteFAQInputSchema,
  MAX_FAQS_PER_STORE,
} from "../schema";

const ERR_UNPROCESSABLE = "요청을 처리할 수 없습니다";

async function tryGenerateEmbedding(
  text: string,
  ctx: { storeIdShort: string },
): Promise<number[] | null> {
  try {
    const result = await generateEmbedding({ text });
    return result.embedding;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { phase: "faq_embedding" },
      extra: { storeIdShort: ctx.storeIdShort, textLength: text.length },
    });
    return null;
  }
}

export async function createFAQ(input: {
  question: string;
  answer: string;
}): Promise<{ ok: true; id: string }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = createFAQInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    // count 한도 — list({ limit: MAX+1 }) length로 체크. 단일 쿼리.
    const existing = await listStoreKnowledge(db, session.storeId, {
      limit: MAX_FAQS_PER_STORE + 1,
    });
    if (existing.length >= MAX_FAQS_PER_STORE) {
      throw new ValidationError(
        `FAQ가 가득 찼습니다 (최대 ${MAX_FAQS_PER_STORE}개). 기존 FAQ를 삭제하고 다시 시도해주세요.`,
      );
    }

    const embedding = await tryGenerateEmbedding(
      `${parsed.data.question}\n${parsed.data.answer}`,
      { storeIdShort: session.storeId.slice(0, 8) },
    );

    const created = await createStoreKnowledge(db, {
      storeId: session.storeId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      embedding,
    });

    revalidatePath("/[locale]/store/knowledge", "page");
    return { ok: true as const, id: created.id };
  } catch (err) {
    captureServerActionError(err, {
      action: "knowledge.createFAQ",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}

export async function updateFAQ(input: {
  id: string;
  question: string;
  answer: string;
}): Promise<{ ok: true }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = updateFAQInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    const embedding = await tryGenerateEmbedding(
      `${parsed.data.question}\n${parsed.data.answer}`,
      { storeIdShort: session.storeId.slice(0, 8) },
    );

    const updated = await updateStoreKnowledge(
      db,
      parsed.data.id,
      session.storeId,
      {
        question: parsed.data.question,
        answer: parsed.data.answer,
        embedding,
      },
    );
    if (!updated) {
      throw new ValidationError(ERR_UNPROCESSABLE);
    }

    revalidatePath("/[locale]/store/knowledge", "page");
    return { ok: true as const };
  } catch (err) {
    captureServerActionError(err, {
      action: "knowledge.updateFAQ",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}

export async function deleteFAQ(input: { id: string }): Promise<{ ok: true }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = deleteFAQInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    const deleted = await deleteStoreKnowledge(
      db,
      parsed.data.id,
      session.storeId,
    );
    if (!deleted) {
      throw new ValidationError(ERR_UNPROCESSABLE);
    }

    revalidatePath("/[locale]/store/knowledge", "page");
    return { ok: true as const };
  } catch (err) {
    captureServerActionError(err, {
      action: "knowledge.deleteFAQ",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
