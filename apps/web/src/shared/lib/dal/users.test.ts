/**
 * dal/users — 통합 테스트 (HESYA_TEST_DATABASE_URL 설정 시만 실행).
 *
 * Epic 12-α — 0030 마이그(users.role)가 적용된 DB 필요. 적용 안 된 환경에선
 * SQL error로 fail — 그 경우 본 테스트는 skip 권장 (마이그 적용 후 재실행).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import { findRoleByUserId } from "./users";
import { resetDb, seedUser } from "@/test-helpers/db";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.users (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it("등록 안 된 user → null 반환", async () => {
    const got = await findRoleByUserId(
      db,
      "00000000-0000-0000-0000-000000000000",
    );
    expect(got).toBeNull();
  });

  it("user row 있고 role 기본값 → { role: 'user' }", async () => {
    const userId = await seedUser(db);

    const got = await findRoleByUserId(db, userId);

    expect(got).not.toBeNull();
    expect(got!.role).toBe("user");
  });
});
