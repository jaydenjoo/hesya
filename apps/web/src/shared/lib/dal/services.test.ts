import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDbClient, services, type DbClient } from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";
import { listServicesByIds, listServicesByStore } from "./services";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.services (integration)", () => {
  let db: DbClient;
  let storeId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
  });

  it("listServicesByStore — nameKo asc 정렬", async () => {
    await db.insert(services).values([
      { storeId, nameKo: "펌", priceKrw: 80000, category: "perm" },
      { storeId, nameKo: "컷", priceKrw: 30000, category: "cut" },
    ]);
    const rows = await listServicesByStore(db, storeId);
    expect(rows.map((r) => r.nameKo)).toEqual(["컷", "펌"]);
  });

  it("listServicesByIds — 빈 배열 → 빈 결과 (no SQL)", async () => {
    const rows = await listServicesByIds(db, []);
    expect(rows).toEqual([]);
  });
});
