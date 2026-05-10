import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createDbClient,
  eq,
  storeDeletionRequests,
  stores,
  type DbClient,
} from "@hesya/database";

import {
  cancelStoreDeletion,
  getActiveDeletionRequest,
  listDeletionRequestsForAdmin,
  purgeExpiredStoreDeletions,
  requestStoreDeletion,
  StoreDeletionConflictError,
  StoreDeletionNotFoundError,
} from "./store-deletion";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

async function seedStore(db: DbClient, name = "테스트 매장"): Promise<string> {
  const [row] = await db.insert(stores).values({ name }).returning();
  if (!row) throw new Error("seedStore failed");
  return row.id;
}

describe.skipIf(!hasDb)("dal.store-deletion (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await db.delete(storeDeletionRequests);
    await db.delete(stores);
  });

  it("requestStoreDeletion: stores.deletedAt set + request row INSERT, scheduled +30d", async () => {
    const storeId = await seedStore(db);
    const now = new Date("2026-05-10T00:00:00Z");

    const req = await requestStoreDeletion(db, {
      storeId,
      source: "owner",
      requestedByEmail: "owner@example.com",
      reason: "사업 종료",
      now,
    });

    expect(req.source).toBe("owner");
    expect(req.requestedByEmail).toBe("owner@example.com");
    expect(req.scheduledPurgeAt).toEqual(new Date("2026-06-09T00:00:00Z"));

    const [s] = await db.select().from(stores).where(eq(stores.id, storeId));
    expect(s?.deletedAt).toEqual(now);
    expect(s?.deletionReason).toBe("사업 종료");
  });

  it("requestStoreDeletion: 존재하지 않는 storeId → StoreDeletionNotFoundError", async () => {
    await expect(
      requestStoreDeletion(db, {
        storeId: "00000000-0000-0000-0000-000000000000",
        source: "admin",
        requestedByEmail: "admin@example.com",
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(StoreDeletionNotFoundError);
  });

  it("requestStoreDeletion: 활성 요청이 이미 있으면 StoreDeletionConflictError", async () => {
    const storeId = await seedStore(db);
    await requestStoreDeletion(db, {
      storeId,
      source: "owner",
      requestedByEmail: "a@example.com",
    });

    await expect(
      requestStoreDeletion(db, {
        storeId,
        source: "admin",
        requestedByEmail: "admin@example.com",
      }),
    ).rejects.toBeInstanceOf(StoreDeletionConflictError);
  });

  it("cancelStoreDeletion: stores.deletedAt 복원 + request.cancelledAt set", async () => {
    const storeId = await seedStore(db);
    await requestStoreDeletion(db, {
      storeId,
      source: "owner",
      requestedByEmail: "owner@example.com",
    });

    const cancelled = await cancelStoreDeletion(db, {
      storeId,
      cancelledByEmail: "owner@example.com",
    });
    expect(cancelled?.cancelledAt).not.toBeNull();
    expect(cancelled?.cancelledByEmail).toBe("owner@example.com");

    const [s] = await db.select().from(stores).where(eq(stores.id, storeId));
    expect(s?.deletedAt).toBeNull();
    expect(s?.deletionReason).toBeNull();
  });

  it("cancelStoreDeletion: 활성 요청 없으면 null (no-op)", async () => {
    const storeId = await seedStore(db);
    const result = await cancelStoreDeletion(db, {
      storeId,
      cancelledByEmail: "nobody@example.com",
    });
    expect(result).toBeNull();
  });

  it("requestStoreDeletion: 취소 후 재요청 가능 (활성 요청 1개 제약)", async () => {
    const storeId = await seedStore(db);
    await requestStoreDeletion(db, {
      storeId,
      source: "owner",
      requestedByEmail: "owner@example.com",
    });
    await cancelStoreDeletion(db, {
      storeId,
      cancelledByEmail: "owner@example.com",
    });

    const second = await requestStoreDeletion(db, {
      storeId,
      source: "admin",
      requestedByEmail: "admin@example.com",
      reason: "약관 위반",
    });
    expect(second.source).toBe("admin");

    const all = await listDeletionRequestsForAdmin(db, { status: "all" });
    expect(all).toHaveLength(2);
  });

  it("getActiveDeletionRequest: 활성만 반환, 취소된 요청 무시", async () => {
    const storeId = await seedStore(db);
    await requestStoreDeletion(db, {
      storeId,
      source: "owner",
      requestedByEmail: "a@example.com",
    });
    await cancelStoreDeletion(db, {
      storeId,
      cancelledByEmail: "a@example.com",
    });
    expect(await getActiveDeletionRequest(db, storeId)).toBeNull();

    await requestStoreDeletion(db, {
      storeId,
      source: "admin",
      requestedByEmail: "admin@example.com",
    });
    expect(await getActiveDeletionRequest(db, storeId)).not.toBeNull();
  });

  it("listDeletionRequestsForAdmin: status 필터 (pending / expired / cancelled)", async () => {
    const pendingStore = await seedStore(db, "pending");
    const expiredStore = await seedStore(db, "expired");
    const cancelledStore = await seedStore(db, "cancelled");
    const now = new Date("2026-05-10T00:00:00Z");

    await requestStoreDeletion(db, {
      storeId: pendingStore,
      source: "owner",
      requestedByEmail: "p@example.com",
      now,
    });
    await requestStoreDeletion(db, {
      storeId: expiredStore,
      source: "admin",
      requestedByEmail: "ad@example.com",
      now: new Date("2026-04-01T00:00:00Z"),
    });
    await requestStoreDeletion(db, {
      storeId: cancelledStore,
      source: "owner",
      requestedByEmail: "c@example.com",
      now,
    });
    await cancelStoreDeletion(db, {
      storeId: cancelledStore,
      cancelledByEmail: "c@example.com",
    });

    const pending = await listDeletionRequestsForAdmin(db, {
      status: "pending",
    });
    expect(pending.map((r) => r.storeName)).toEqual(["pending"]);

    const expired = await listDeletionRequestsForAdmin(db, {
      status: "expired",
    });
    expect(expired.map((r) => r.storeName)).toEqual(["expired"]);

    const cancelled = await listDeletionRequestsForAdmin(db, {
      status: "cancelled",
    });
    expect(cancelled.map((r) => r.storeName)).toEqual(["cancelled"]);
  });

  it("purgeExpiredStoreDeletions: scheduled_purge_at <= now 행 cascade hard-delete", async () => {
    const expiredStore = await seedStore(db, "should-purge");
    const futureStore = await seedStore(db, "should-stay");
    const cancelledStore = await seedStore(db, "should-stay-cancelled");

    // 30일+ 경과 (scheduledPurgeAt < now)
    await requestStoreDeletion(db, {
      storeId: expiredStore,
      source: "owner",
      requestedByEmail: "e@example.com",
      now: new Date("2026-04-01T00:00:00Z"),
    });

    // 미경과
    await requestStoreDeletion(db, {
      storeId: futureStore,
      source: "owner",
      requestedByEmail: "f@example.com",
      now: new Date("2026-05-09T00:00:00Z"),
    });

    // 경과지만 cancelled
    await requestStoreDeletion(db, {
      storeId: cancelledStore,
      source: "owner",
      requestedByEmail: "c@example.com",
      now: new Date("2026-04-01T00:00:00Z"),
    });
    await cancelStoreDeletion(db, {
      storeId: cancelledStore,
      cancelledByEmail: "c@example.com",
    });

    const result = await purgeExpiredStoreDeletions(db, {
      now: new Date("2026-05-10T00:00:00Z"),
    });

    expect(result.purgedStoreIds).toEqual([expiredStore]);
    expect(result.failedStoreIds).toEqual([]);

    const remaining = await db.select({ id: stores.id }).from(stores);
    expect(remaining.map((r) => r.id).sort()).toEqual(
      [futureStore, cancelledStore].sort(),
    );

    const purgedReq = await listDeletionRequestsForAdmin(db, {
      status: "purged",
    });
    expect(purgedReq).toHaveLength(1);
    expect(purgedReq[0]?.storeId).toBe(expiredStore);
  });
});
