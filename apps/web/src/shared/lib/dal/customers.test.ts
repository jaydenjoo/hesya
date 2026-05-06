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

  it("getCustomerPreferredLanguage: preferredLanguage 반환 / 없으면 null (B-2)", async () => {
    const { getCustomerPreferredLanguage } = await import("./customers");
    const c = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "lang_001",
      preferredLanguage: "ja",
    });
    const lang = await getCustomerPreferredLanguage(db, c!.id);
    expect(lang).toBe("ja");

    const c2 = await upsertCustomer(db, {
      channel: "instagram",
      externalId: "lang_002",
    });
    const lang2 = await getCustomerPreferredLanguage(db, c2!.id);
    expect(lang2).toBeNull();
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

  // ─── Customer 확장 (CC-2) ───

  it("module exports updateCustomerProfile + updateCustomerNotes", async () => {
    const mod = await import("./customers");
    expect(typeof mod.updateCustomerProfile).toBe("function");
    expect(typeof mod.updateCustomerNotes).toBe("function");
  });

  it("updateCustomerProfile: customers.id 가드 + name/preferredLanguage 시그니처", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    // customers.id로 WHERE 조건
    expect(src).toMatch(
      /updateCustomerProfile[\s\S]*?eq\(\s*\w+\.id\s*,\s*customerId/,
    );
    // 시그니처에 name 옵셔널 + .set 호출
    expect(src).toMatch(/updateCustomerProfile[\s\S]*?name\?:[\s\S]*?\.set\(/);
  });

  it("updateCustomerNotes: customers.id 가드 + allergyNote/preferredDesigner 시그니처", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    expect(src).toMatch(
      /updateCustomerNotes[\s\S]*?eq\(\s*\w+\.id\s*,\s*customerId/,
    );
    expect(src).toMatch(
      /updateCustomerNotes[\s\S]*?(allergyNote|preferredDesigner)\?:[\s\S]*?\.set\(/,
    );
  });

  it("updateCustomerProfile: empty patch는 no-op (방어)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    // patch 비어있을 때 DB 호출 회피 (무의미한 UPDATE 방어)
    expect(src).toMatch(
      /updateCustomerProfile[\s\S]*?Object\.keys\(\s*patch\s*\)\.length\s*===?\s*0/,
    );
  });

  // ─── Sec MED-1: ig_profile_fetched 플래그 ───
  // 영구 fail customer가 매 inbound마다 IG fetch 무한 retry 도는 것 방어.

  it("updateCustomerProfile: igProfileFetched 옵셔널 patch 지원 (Sec MED-1)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    // 시그니처에 igProfileFetched?: boolean 옵셔널 추가
    expect(src).toMatch(
      /updateCustomerProfile[\s\S]*?igProfileFetched\?:\s*boolean/,
    );
  });

  it("getCustomerById: igProfileFetched 컬럼 select (Sec MED-1)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/customers.ts", "utf-8");
    // ContextPanel 등 caller가 retry 상태 보일 수 있도록 명시 select 포함
    expect(src).toMatch(
      /getCustomerById[\s\S]*?igProfileFetched:\s*customers\.igProfileFetched/,
    );
  });
});
