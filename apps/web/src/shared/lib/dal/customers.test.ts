import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import { getExternalIdByCustomerId, upsertCustomer } from "./customers";
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
    expect(c).not.toBeNull();
    expect(c!.id).toBeDefined();
    expect(c!.channel).toBe("instagram");
    expect(c!.externalId).toBe("igsid_001");
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
    expect(b!.id).toBe(a!.id);
  });

  it("upsertCustomer: preferredLanguage 저장", async () => {
    const c = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_003",
      preferredLanguage: "en",
    });
    expect(c!.preferredLanguage).toBe("en");
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
    expect(b!.id).not.toBe(a!.id);
  });

  it("getExternalIdByCustomerId: 존재 → externalId 반환", async () => {
    const c = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "igsid_lookup",
    });
    const ext = await getExternalIdByCustomerId(db, c!.id);
    expect(ext).toBe("igsid_lookup");
  });

  it("getExternalIdByCustomerId: 미존재 → null", async () => {
    const ext = await getExternalIdByCustomerId(
      db,
      "00000000-0000-0000-0000-000000000000",
    );
    expect(ext).toBeNull();
  });
});

describe("dal.customers (pure)", () => {
  it("module exports upsertCustomer", async () => {
    const mod = await import("./customers");
    expect(typeof mod.upsertCustomer).toBe("function");
  });

  it("module exports getExternalIdByCustomerId", async () => {
    const mod = await import("./customers");
    expect(typeof mod.getExternalIdByCustomerId).toBe("function");
  });

  it("getExternalIdByCustomerId queries customers table with id (mock)", async () => {
    const { vi } = await import("vitest");
    const limitSpy = vi.fn(() => Promise.resolve([{ externalId: "ig_xyz" }]));
    const whereSpy = vi.fn(() => ({ limit: limitSpy }));
    const fromSpy = vi.fn(() => ({ where: whereSpy }));
    const selectSpy = vi.fn(() => ({ from: fromSpy }));
    const fakeDb = { select: selectSpy } as unknown as DbClient;

    const result = await getExternalIdByCustomerId(fakeDb, "cust_123");
    expect(selectSpy).toHaveBeenCalled();
    expect(result).toBe("ig_xyz");
  });

  it("upsertCustomer race condition fallback returns null (review HIGH)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    expect(src).toMatch(/Promise<Customer\s*\|\s*null>/);
    expect(src).not.toMatch(/throw new Error[^"]*"upsertCustomer:/);
  });
});
