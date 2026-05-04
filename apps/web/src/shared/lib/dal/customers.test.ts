import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import { upsertCustomer } from "./customers";
import { resetDb } from "@/test-helpers/db";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.customers (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it("upsertCustomer: 신규 생성", async () => {
    const c = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_001",
    });
    expect(c.id).toBeDefined();
    expect(c.channel).toBe("instagram");
    expect(c.externalId).toBe("igsid_001");
  });

  it("upsertCustomer: 동일 (channel, externalId) 재호출은 같은 row (idempotent)", async () => {
    const a = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_002",
    });
    const b = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_002",
    });
    expect(b.id).toBe(a.id);
  });

  it("upsertCustomer: preferredLanguage 저장", async () => {
    const c = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_003",
      preferredLanguage: "en",
    });
    expect(c.preferredLanguage).toBe("en");
  });

  it("upsertCustomer: 다른 channel은 별 row", async () => {
    const a = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "shared_id",
    });
    const b = await upsertCustomer(db, {
      channel: "whatsapp",
      externalId: "shared_id",
    });
    expect(b.id).not.toBe(a.id);
  });
});

describe("dal.customers (pure)", () => {
  it("module exports upsertCustomer", async () => {
    const mod = await import("./customers");
    expect(typeof mod.upsertCustomer).toBe("function");
  });
});
