import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, eq, stores, type DbClient } from "@hesya/database";
import { findByUserId, findStoreStatusByUserId } from "./store-owners";
import {
  resetDb,
  seedStore,
  seedStoreOwner,
  seedUser,
} from "@/test-helpers/db";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.store-owners (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it("등록 안 된 user → null 반환", async () => {
    const got = await findByUserId(db, "00000000-0000-0000-0000-000000000000");
    expect(got).toBeNull();
  });

  it("등록된 user → { storeId, role: 'owner' }", async () => {
    const userId = await seedUser(db);
    const storeId = await seedStore(db);
    await seedStoreOwner(db, { userId, storeId, role: "owner" });

    const got = await findByUserId(db, userId);
    expect(got).not.toBeNull();
    expect(got!.storeId).toBe(storeId);
    expect(got!.role).toBe("owner");
  });

  it("manager role도 정상 반환", async () => {
    const userId = await seedUser(db);
    const storeId = await seedStore(db);
    await seedStoreOwner(db, { userId, storeId, role: "manager" });

    const got = await findByUserId(db, userId);
    expect(got!.role).toBe("manager");
  });

  describe("findStoreStatusByUserId", () => {
    it("등록 안 된 user → null 반환", async () => {
      const got = await findStoreStatusByUserId(
        db,
        "00000000-0000-0000-0000-000000000000",
      );
      expect(got).toBeNull();
    });

    it("등록된 user + store → { storeId, verificationStatus }", async () => {
      const userId = await seedUser(db);
      const storeId = await seedStore(db);
      await seedStoreOwner(db, { userId, storeId, role: "owner" });
      // seedStore는 verificationStatus 기본값(null) — 명시적으로 설정.
      await db
        .update(stores)
        .set({ verificationStatus: "manual_review" })
        .where(eq(stores.id, storeId));

      const got = await findStoreStatusByUserId(db, userId);
      expect(got).not.toBeNull();
      expect(got!.storeId).toBe(storeId);
      expect(got!.verificationStatus).toBe("manual_review");
    });
  });
});

describe("dal.store-owners (pure)", () => {
  it("module exports findByUserId + findStoreStatusByUserId", async () => {
    const mod = await import("./store-owners");
    expect(typeof mod.findByUserId).toBe("function");
    expect(typeof mod.findStoreStatusByUserId).toBe("function");
  });
});
