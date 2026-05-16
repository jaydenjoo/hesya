import "server-only";
import { asc, eq, users, type DbClient } from "@hesya/database";

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

/**
 * Phase 1-γ.2 batch 6 — cron alert recipient lookup.
 *
 * 첫 번째 admin 사용자의 email을 반환. cron route(`revalidate-stores`)가
 * KYC 재검증 결과를 운영팀에게 알릴 때 recipient로 사용. 기존엔
 * `env.ADMIN_EMAILS.split(",")[0]`을 사용했으나 γ.2 마이그 후 DB role 단일
 * source-of-truth 패턴 정합 + ADMIN_EMAILS env 의존 제거.
 *
 * `ORDER BY created_at ASC LIMIT 1` — 결정적 첫 번째 admin. role UPDATE 순서에
 * 따라 다르므로 "운영팀 대표"가 아닌 "가장 먼저 promote된 admin". 운영 의미상
 * Jayden 본인일 가능성 높음. 향후 "ops_email" 별도 컬럼/env 도입 시 자연 교체.
 *
 * admin row 0건 → null (cron route가 console.error로 보고하고 알림 skip).
 */
export async function findFirstAdminEmail(
  db: DbClient,
): Promise<{ email: string } | null> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.createdAt))
    .limit(1);
  if (!rows[0]) return null;
  return { email: rows[0].email };
}
