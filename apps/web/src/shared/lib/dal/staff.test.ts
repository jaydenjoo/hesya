import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDbClient, staff, type DbClient } from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";
import { listStaffByIds, listStaffByStore } from "./staff";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.staff (integration)", () => {
  let db: DbClient;
  let storeId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
  });

  it("listStaffByStore — name asc 정렬", async () => {
    await db.insert(staff).values([
      { storeId, name: "수아" },
      { storeId, name: "민지" },
    ]);
    const rows = await listStaffByStore(db, storeId);
    expect(rows.map((r) => r.name)).toEqual(["민지", "수아"]);
  });

  it("listStaffByIds — 빈 배열 → 빈 결과 (no SQL)", async () => {
    const rows = await listStaffByIds(db, []);
    expect(rows).toEqual([]);
  });
});
