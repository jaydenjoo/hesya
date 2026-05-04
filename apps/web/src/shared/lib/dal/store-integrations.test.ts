import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import {
  upsertIntegration,
  getIntegration,
  markWebhookSubscribed,
} from "./store-integrations";
import { resetDb, seedStore } from "@/test-helpers/db";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.store-integrations (integration)", () => {
  let db: DbClient;
  let storeId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
  });

  it("upsert + get 라운드트립, 토큰 자동 복호화", async () => {
    await upsertIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_1",
      externalPageId: "fb_page_1",
      accessToken: "ig_long_lived_token_xyz",
      tokenExpiresAt: new Date("2026-07-04T00:00:00Z"),
      scopes: [
        "instagram_business_basic",
        "instagram_business_manage_messages",
      ],
    });

    const got = await getIntegration(db, storeId, "instagram");
    expect(got).not.toBeNull();
    expect(got!.externalAccountId).toBe("ig_acc_1");
    expect(got!.externalPageId).toBe("fb_page_1");
    expect(got!.accessToken).toBe("ig_long_lived_token_xyz");
    expect(got!.scopes).toContain("instagram_business_manage_messages");
  });

  it("미존재 통합은 null 반환", async () => {
    const got = await getIntegration(db, storeId, "instagram");
    expect(got).toBeNull();
  });

  it("upsert 두 번째 호출은 갱신, 토큰 재복호화 정상", async () => {
    await upsertIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_1",
      accessToken: "old_token",
    });
    await upsertIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_1_updated",
      accessToken: "new_token",
    });

    const got = await getIntegration(db, storeId, "instagram");
    expect(got!.externalAccountId).toBe("ig_acc_1_updated");
    expect(got!.accessToken).toBe("new_token");
  });

  it("markWebhookSubscribed: webhookSubscribedAt 셋팅", async () => {
    await upsertIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_1",
      accessToken: "tok",
    });
    await markWebhookSubscribed(db, storeId, "instagram");
    const got = await getIntegration(db, storeId, "instagram");
    expect(got!.webhookSubscribedAt).not.toBeNull();
  });
});

describe("dal.store-integrations (pure)", () => {
  it("module exports 3 functions", async () => {
    const mod = await import("./store-integrations");
    expect(typeof mod.upsertIntegration).toBe("function");
    expect(typeof mod.getIntegration).toBe("function");
    expect(typeof mod.markWebhookSubscribed).toBe("function");
  });
});
