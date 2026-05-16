import "server-only";
import { eq, users, type DbClient } from "@hesya/database";

/**
 * Epic 12-α — users.role 단일 컬럼 조회 helper.
 *
 * `requireAdminRole` 가드가 Better Auth session.user.id로 호출. row 없으면
 * null (Better Auth가 row 항상 생성하므로 실전 발생 X — 가드가 unauthorized
 * 분기 처리). 마이그 0030 apply 전 호출 시 컬럼 부재로 SQL error → 가드는
 * try/catch로 unauthorized 응답.
 */
export async function findRoleByUserId(
  db: DbClient,
  userId: string,
): Promise<{ role: "user" | "admin" } | null> {
  const rows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!rows[0]) return null;
  return { role: rows[0].role as "user" | "admin" };
}
