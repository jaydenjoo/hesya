import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import {
  insertMessage,
  listByConversation,
  listRecentByConversation,
  markFailed,
} from "./messages";
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
    expect(m).not.toBeNull();
    expect(m!.id).toBeDefined();
    expect(m!.conversationId).toBe(conversationId);
    expect(m!.direction).toBe("inbound");
    expect(m!.originalText).toBe("안녕");
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
    expect(b!.id).toBe(a!.id);
  });

  it("insertMessage: outbound는 status='sent' 기본값", async () => {
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "응답",
      externalMessageId: "mid_out_1",
    });
    expect(m!.status).toBe("sent");
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

  it("listRecentByConversation: 최신 N개를 ASC 순서로 반환 (B-2)", async () => {
    for (let i = 1; i <= 7; i++) {
      await insertMessage(db, {
        conversationId,
        channel: "instagram",
        direction: i % 2 === 1 ? "inbound" : "outbound",
        originalText: `m${i}`,
        externalMessageId: `mid_recent_${i}`,
      });
    }
    const recent = await listRecentByConversation(db, conversationId, 5);
    expect(recent).toHaveLength(5);
    expect(recent.map((m) => m.originalText)).toEqual([
      "m3",
      "m4",
      "m5",
      "m6",
      "m7",
    ]);
  });

  it("markAIResponded: 첫 호출은 true, 두 번째는 false (race-safe, B-2 review)", async () => {
    const { markAIResponded } = await import("./messages");
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "race test",
      externalMessageId: "mid_race_1",
    });
    const first = await markAIResponded(db, m!.id);
    const second = await markAIResponded(db, m!.id);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("markTranslated: outbound에 translated_text + language_to 저장 (B-3a)", async () => {
    const { markTranslated } = await import("./messages");
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "안녕하세요",
      externalMessageId: "mid_translate_1",
      status: "ai_draft",
    });
    await markTranslated(db, m!.id, {
      translatedText: "Hello",
      languageTo: "en",
    });
    const list = await listByConversation(db, conversationId);
    const updated = list.find((x) => x.id === m!.id);
    expect(updated?.translatedText).toBe("Hello");
    expect(updated?.languageTo).toBe("en");
  });

  it("markFailed: status='failed'로 변경", async () => {
    const m = await insertMessage(db, {
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "보내기 실패할 메시지",
      externalMessageId: "mid_fail_1",
    });
    await markFailed(db, m!.id);
    const list = await listByConversation(db, conversationId);
    expect(list[0]?.status).toBe("failed");
  });
});

describe("dal.messages (pure)", () => {
  it("module exports B-2 functions (findMessageById + markAIResponded)", async () => {
    const mod = await import("./messages");
    expect(typeof mod.insertMessage).toBe("function");
    expect(typeof mod.listByConversation).toBe("function");
    expect(typeof mod.listRecentByConversation).toBe("function");
    expect(typeof mod.findMessageById).toBe("function");
    expect(typeof mod.markAIResponded).toBe("function");
    expect(typeof mod.markFailed).toBe("function");
  });

  it("module exports markTranslated (B-3a)", async () => {
    const mod = await import("./messages");
    expect(typeof mod.markTranslated).toBe("function");
  });

  it("module exports B-3c functions (claim/markSent/revert)", async () => {
    const mod = await import("./messages");
    expect(typeof mod.claimAiDraftForSend).toBe("function");
    expect(typeof mod.markMessageSent).toBe("function");
    expect(typeof mod.revertAiDraftClaim).toBe("function");
  });

  it("claimAiDraftForSend: race-safe conditional UPDATE WHERE status='ai_draft' (B-3c)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(
      /claimAiDraftForSend[\s\S]*?eq\(messages\.status,\s*["']ai_draft["']\)/,
    );
    expect(src).toMatch(/claimAiDraftForSend[\s\S]*?\.returning\(/);
  });

  it("revertAiDraftClaim UPDATE는 status='sending' 가드 (B-3c)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(
      /revertAiDraftClaim[\s\S]*?eq\(messages\.status,\s*["']sending["']\)/,
    );
  });

  it("markMessageSent UPDATE는 status='sending' 가드 (B-3c)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(
      /markMessageSent[\s\S]*?eq\(messages\.status,\s*["']sending["']\)/,
    );
  });

  it("listByConversation supports offset for pagination (review M-2)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(/\.offset\(/);
    expect(src).toMatch(/offset\?\s*:\s*number/);
  });

  it("markTranslated UPDATE는 direction='outbound' 가드 (B-3a review LOW)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(
      /markTranslated[\s\S]*?eq\(messages\.direction,\s*["']outbound["']\)/,
    );
  });

  it("markAIResponded conditional UPDATE returns boolean (B-2 review HIGH)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(/markAIResponded[\s\S]*?Promise<boolean>/);
    expect(src).toMatch(/aiResponded,\s*false/);
  });

  it("insertMessage race condition fallback returns null (review HIGH)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/messages.ts", "utf-8");
    expect(src).toMatch(/Promise<Message\s*\|\s*null>/);
    expect(src).not.toMatch(
      /throw new Error[^"]*"insertMessage:[^"]*not found/,
    );
  });
});
