/**
 * Phase B-2 통합 테스트 — DB-gated.
 *
 * generateReply만 mock하고 DB 흐름(message 조회 / outbound insert /
 * aiResponded 마킹 / revalidatePath)은 실제 환경에서 검증.
 *
 * Skip 시그널: HESYA_TEST_DATABASE_URL 미설정 시 자동 skip (DAL 통합 테스트와 동일 패턴).
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createDbClient, type DbClient } from "@hesya/database";
import {
  resetDb,
  seedStore,
  seedConversation,
  seedMessage,
} from "@/test-helpers/db";
import { upsertCustomer } from "@/shared/lib/dal/customers";
import { findMessageById, listByConversation } from "@/shared/lib/dal/messages";
import { generateAndStoreReply } from "./generate-and-store-reply";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("generateAndStoreReply (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it("happy path: outbound ai_draft 저장 + inbound aiResponded=true", async () => {
    const storeId = await seedStore(db, { name: "테스트 매장" });
    const customer = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_b2_intg",
      preferredLanguage: "en",
    });
    const convId = await seedConversation(db, {
      storeId,
      customerId: customer!.id,
      channel: "instagram",
    });
    const inboundId = await seedMessage(db, {
      conversationId: convId,
      customerId: customer!.id,
      direction: "inbound",
      text: "Hello",
    });

    const generateReplyStub = vi.fn().mockResolvedValue({
      reply: "안녕하세요!",
      tokensUsed: { input: 5, output: 3 },
    });
    const translateReplyStub = vi.fn().mockResolvedValue({
      translatedText: "Hello!",
      tokensUsed: { input: 4, output: 2 },
    });

    const result = await generateAndStoreReply(inboundId, {
      db,
      generateReply: generateReplyStub,
      translateReply: translateReplyStub,
    });

    expect(result).toEqual({
      stored: true,
      aiMessageId: expect.any(String),
      tokensUsed: { input: 5, output: 3 },
    });
    expect(generateReplyStub).toHaveBeenCalledWith({
      storeName: "테스트 매장",
      customerLanguage: "en",
      recentMessages: [{ direction: "inbound", text: "Hello" }],
    });
    expect(translateReplyStub).toHaveBeenCalledWith({
      koreanText: "안녕하세요!",
      targetLanguage: "en",
    });

    const all = await listByConversation(db, convId);
    expect(all).toHaveLength(2);
    const outbound = all[1]!;
    expect(outbound.direction).toBe("outbound");
    expect(outbound.originalText).toBe("안녕하세요!");
    expect(outbound.status).toBe("ai_draft");
    expect(outbound.translatedText).toBe("Hello!");
    expect(outbound.languageTo).toBe("en");

    const inbound = await findMessageById(db, inboundId);
    expect(inbound?.aiResponded).toBe(true);
  });

  it("이미 응답한 inbound 재호출 → already_responded skip (멱등)", async () => {
    const storeId = await seedStore(db);
    const customer = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_b2_idem",
    });
    const convId = await seedConversation(db, {
      storeId,
      customerId: customer!.id,
      channel: "instagram",
    });
    const inboundId = await seedMessage(db, {
      conversationId: convId,
      direction: "inbound",
      text: "안녕",
    });

    const stub = vi.fn().mockResolvedValue({
      reply: "응답",
      tokensUsed: { input: 1, output: 1 },
    });
    const tStub = vi.fn().mockResolvedValue({
      translatedText: "x",
      tokensUsed: { input: 1, output: 1 },
    });

    await generateAndStoreReply(inboundId, {
      db,
      generateReply: stub,
      translateReply: tStub,
    });
    const second = await generateAndStoreReply(inboundId, {
      db,
      generateReply: stub,
      translateReply: tStub,
    });

    expect(second).toEqual({ stored: false, reason: "already_responded" });
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it("시나리오 3 (B-1~B-4 통합): FAQ 시드 → RAG 검색 결과가 generateReply에 주입", async () => {
    // C-light: 회귀 안전망 — RAG 파이프라인이 실제 DB에서 작동하는지 검증.
    // FAQ row를 직접 storeKnowledge에 시드(임베딩 1536d 임의값) → embed stub이
    // 같은 차원 벡터 반환 → searchSimilarKnowledge 실제 cosine distance 계산 →
    // hits가 generateReply에 relatedFAQs로 전달되는지 검증.
    const { storeKnowledge } = await import("@hesya/database");
    const { generateAndStoreReply: gsr } =
      await import("./generate-and-store-reply");

    const storeId = await seedStore(db, { name: "단발 매장" });
    const customer = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_c_light",
      preferredLanguage: "ko",
    });
    const convId = await seedConversation(db, {
      storeId,
      customerId: customer!.id,
      channel: "instagram",
    });
    const inboundId = await seedMessage(db, {
      conversationId: convId,
      customerId: customer!.id,
      storeId,
      direction: "inbound",
      text: "단발 가능한가요?",
    });

    // FAQ 시드 — 임베딩은 모두 0.1로 채워 embed stub과 cosine distance 0 유지.
    const faqEmbedding = Array(1536).fill(0.1);
    await db.insert(storeKnowledge).values({
      storeId,
      question: "단발 가능?",
      answer: "네 가능합니다 (5만원). DM으로 예약 받습니다.",
      embedding: faqEmbedding,
    });

    const generateReplyStub = vi.fn().mockResolvedValue({
      reply: "안녕하세요! 단발 5만원에 가능합니다.",
      tokensUsed: { input: 10, output: 8 },
    });
    const translateReplyStub = vi.fn(); // ko → no-op
    const embedStub = vi.fn().mockResolvedValue({
      embedding: faqEmbedding,
      tokensUsed: 5,
    });

    const result = await gsr(inboundId, {
      db,
      generateReply: generateReplyStub,
      translateReply: translateReplyStub,
      generateEmbedding: embedStub,
    });

    expect(result.stored).toBe(true);
    // RAG 핵심 검증: relatedFAQs가 실제 DB cosine 검색 결과로 generateReply에 주입.
    expect(generateReplyStub).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedFAQs: [
          {
            question: "단발 가능?",
            answer: "네 가능합니다 (5만원). DM으로 예약 받습니다.",
          },
        ],
      }),
    );
    expect(embedStub).toHaveBeenCalledWith({ text: "단발 가능한가요?" });
  });
});
