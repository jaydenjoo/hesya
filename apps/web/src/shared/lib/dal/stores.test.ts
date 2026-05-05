import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import * as dalStores from "./stores";
import {
  findStoreByExternalAccount,
  findStoreNameByConversationId,
} from "./stores";
import { upsertIntegration } from "./store-integrations";
import { upsertConversation } from "./conversations";
import { resetDb, seedStore, seedCustomer } from "@/test-helpers/db";

describe("dal.stores (pure)", () => {
  it("module exports findStoreByExternalAccount function", () => {
    expect(typeof dalStores.findStoreByExternalAccount).toBe("function");
  });

  it("module exports findStoreNameByConversationId function (B-2)", () => {
    expect(typeof dalStores.findStoreNameByConversationId).toBe("function");
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.stores (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  describe("findStoreByExternalAccount", () => {
    it("연결된 (channel, externalAccountId) 일치 → 매장 반환", async () => {
      const storeId = await seedStore(db);
      await upsertIntegration(db, {
        storeId,
        channel: "instagram",
        externalAccountId: "ig_acc_001",
        accessToken: "tok_test",
        scopes: ["instagram_business_basic"],
      });

      const found = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: "ig_acc_001",
      });

      expect(found).toEqual({ id: storeId });
    });

    it("미연결 externalAccountId → null", async () => {
      const found = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: "ig_acc_unknown",
      });
      expect(found).toBeNull();
    });

    it("같은 externalAccountId여도 channel 다르면 null", async () => {
      const storeId = await seedStore(db);
      await upsertIntegration(db, {
        storeId,
        channel: "instagram",
        externalAccountId: "shared_id",
        accessToken: "tok_test",
        scopes: ["instagram_business_basic"],
      });

      const found = await findStoreByExternalAccount(db, {
        channel: "messenger",
        externalAccountId: "shared_id",
      });
      expect(found).toBeNull();
    });
  });

  describe("findStoreNameByConversationId (B-2)", () => {
    it("conversation→store 조인으로 이름 반환", async () => {
      const storeId = await seedStore(db, { name: "맛있는 빵집" });
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "igsid_b2_1",
      });
      const conv = await upsertConversation(db, {
        storeId,
        customerId,
        channel: "instagram",
      });

      const name = await findStoreNameByConversationId(db, conv.id);
      expect(name).toBe("맛있는 빵집");
    });

    it("존재하지 않는 conversationId → null", async () => {
      const name = await findStoreNameByConversationId(
        db,
        "00000000-0000-0000-0000-000000000000",
      );
      expect(name).toBeNull();
    });
  });
});
