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
      direction: "inbound",
      text: "Hello",
    });

    const generateReplyStub = vi.fn().mockResolvedValue({
      reply: "Hi there!",
      tokensUsed: { input: 5, output: 3 },
    });

    const result = await generateAndStoreReply(inboundId, {
      db,
      generateReply: generateReplyStub,
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

    const all = await listByConversation(db, convId);
    expect(all).toHaveLength(2);
    const outbound = all[1]!;
    expect(outbound.direction).toBe("outbound");
    expect(outbound.originalText).toBe("Hi there!");
    expect(outbound.status).toBe("ai_draft");

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

    await generateAndStoreReply(inboundId, { db, generateReply: stub });
    const second = await generateAndStoreReply(inboundId, {
      db,
      generateReply: stub,
    });

    expect(second).toEqual({ stored: false, reason: "already_responded" });
    expect(stub).toHaveBeenCalledTimes(1);
  });
});
