import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import { insertMessage, listByConversation, markFailed } from "./messages";
import { upsertConversation } from "./conversations";
import { resetDb, seedStore, seedCustomer } from "@/test-helpers/db";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.messages (integration)", () => {
  let db: DbClient;
  let conversationId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    const storeId = await seedStore(db);
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_001",
    });
    const c = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    conversationId = c.id;
  });

  it("insertMessage: 신규 메시지 생성", async () => {
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "안녕",
      externalMessageId: "mid_1",
    });
    expect(m.id).toBeDefined();
    expect(m.conversationId).toBe(conversationId);
    expect(m.direction).toBe("inbound");
    expect(m.originalText).toBe("안녕");
  });

  it("insertMessage: 동일 (channel, external_message_id) 재호출은 같은 row (idempotent)", async () => {
    const a = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "x",
      externalMessageId: "mid_2",
    });
    const b = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "x",
      externalMessageId: "mid_2",
    });
    expect(b.id).toBe(a.id);
  });

  it("insertMessage: outbound는 status='sent' 기본값", async () => {
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "응답",
      externalMessageId: "mid_out_1",
    });
    expect(m.status).toBe("sent");
  });

  it("listByConversation: created_at ASC, conversation 한정", async () => {
    await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "1",
      externalMessageId: "m1",
    });
    await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "2",
      externalMessageId: "m2",
    });
    const list = await listByConversation(db, conversationId);
    expect(list).toHaveLength(2);
    expect(list[0]?.originalText).toBe("1");
    expect(list[1]?.originalText).toBe("2");
  });

  it("markFailed: status='failed'로 변경", async () => {
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "보내기 실패할 메시지",
      externalMessageId: "mid_fail_1",
    });
    await markFailed(db, m.id);
    const list = await listByConversation(db, conversationId);
    expect(list[0]?.status).toBe("failed");
  });
});

describe("dal.messages (pure)", () => {
  it("module exports 3 functions", async () => {
    const mod = await import("./messages");
    expect(typeof mod.insertMessage).toBe("function");
    expect(typeof mod.listByConversation).toBe("function");
    expect(typeof mod.markFailed).toBe("function");
  });
});
