import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import {
  upsertConversation,
  getConversationById,
  listByStore,
  incrementUnread,
  markAllRead,
  setMessagingWindow,
  updateLastMessage,
} from "./conversations";
import { resetDb, seedStore, seedCustomer } from "@/test-helpers/db";

/**
 * 통합 테스트 — 실제 Postgres(prod 또는 dev branch)에 연결.
 *
 * `HESYA_TEST_DATABASE_URL` env가 셋팅된 경우에만 실행. 미설정 시 skip
 * (CI 안전 통과). DAL 함수 시그니처는 Phase B vault helper와 일관성 유지
 * 위해 `db: DbClient` 인자로 받음 (env.ts 로드 디커플).
 */
const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.conversations (integration)", () => {
  let db: DbClient;
  let storeId: string;
  let customerId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
    customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_001",
    });
  });

  it("upsertConversation: 신규 시 status='open' / unread=0", async () => {
    const c = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "t_1",
    });
    expect(c.id).toBeDefined();
    expect(c.status).toBe("open");
    expect(c.unreadCount).toBe(0);
    expect(c.externalThreadId).toBe("t_1");
  });

  it("upsertConversation: 동일 (store, customer, channel) 재호출은 같은 row", async () => {
    const a = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    const b = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    expect(b.id).toBe(a.id);
  });

  it("setMessagingWindow: expires_at = lastInboundAt + 24h", async () => {
    const c = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    const inboundAt = new Date("2026-05-04T10:00:00Z");
    await setMessagingWindow(db, c.id, inboundAt);

    const reloaded = await getConversationById(db, c.id);
    expect(reloaded?.messagingWindowExpiresAt?.getTime()).toBe(
      inboundAt.getTime() + 24 * 60 * 60 * 1000,
    );
    expect(reloaded?.lastInboundAt?.getTime()).toBe(inboundAt.getTime());
  });

  it("listByStore: 동일 store의 conversations 반환 (default status='open')", async () => {
    const c1 = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    const customer2 = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_002",
    });
    const c2 = await upsertConversation(db, {
      storeId,
      customerId: customer2,
      channel: "instagram",
    });

    const list = await listByStore(db, storeId);
    expect(list.map((r) => r.id)).toContain(c1.id);
    expect(list.map((r) => r.id)).toContain(c2.id);
  });

  it("listByStore: customer.name 동봉 (UI가 UUID 대신 이름 표시)", async () => {
    const namedCustomer = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_named",
      name: "Mei Tanaka",
    });
    await upsertConversation(db, {
      storeId,
      customerId: namedCustomer,
      channel: "instagram",
    });
    const list = await listByStore(db, storeId);
    const row = list.find((r) => r.customerId === namedCustomer);
    expect(row?.customerName).toBe("Mei Tanaka");
  });

  it("incrementUnread + markAllRead", async () => {
    const c = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    await incrementUnread(db, c.id);
    await incrementUnread(db, c.id);
    expect((await getConversationById(db, c.id))?.unreadCount).toBe(2);

    await markAllRead(db, c.id);
    expect((await getConversationById(db, c.id))?.unreadCount).toBe(0);
  });

  it("updateLastMessage: preview / at 갱신", async () => {
    const c = await upsertConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
    const at = new Date("2026-05-04T11:00:00Z");
    await updateLastMessage(db, c.id, { preview: "안녕하세요", at });

    const reloaded = await getConversationById(db, c.id);
    expect(reloaded?.lastMessagePreview).toBe("안녕하세요");
    expect(reloaded?.lastMessageAt?.getTime()).toBe(at.getTime());
  });
});

describe("dal.conversations (pure)", () => {
  it("module exports 7 functions", async () => {
    const mod = await import("./conversations");
    expect(typeof mod.upsertConversation).toBe("function");
    expect(typeof mod.getConversationById).toBe("function");
    expect(typeof mod.listByStore).toBe("function");
    expect(typeof mod.incrementUnread).toBe("function");
    expect(typeof mod.markAllRead).toBe("function");
    expect(typeof mod.setMessagingWindow).toBe("function");
    expect(typeof mod.updateLastMessage).toBe("function");
  });
});

describe("Channel 단일 소스 (review M-1)", () => {
  it("@hesya/database가 CHANNELS 상수와 Channel 타입을 export", async () => {
    const mod = await import("@hesya/database");
    expect(mod.CHANNELS).toEqual([
      "instagram",
      "whatsapp",
      "kakao",
      "line",
      "messenger",
    ]);
  });
});
