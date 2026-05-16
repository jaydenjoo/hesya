import "server-only";
import {
  and,
  eq,
  storeOwners,
  stores,
  users,
  type DbClient,
} from "@hesya/database";

export async function findByUserId(
  db: DbClient,
  userId: string,
): Promise<{ storeId: string; role: "owner" | "manager" } | null> {
  const rows = await db
    .select()
    .from(storeOwners)
    .where(eq(storeOwners.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return {
    storeId: rows[0].storeId,
    role: rows[0].role as "owner" | "manager",
  };
}

/**
 * Owner의 첫 store_owners row → stores.verification_status 조회.
 *
 * pending page + /api/store/me/status route handler 양쪽에서 동일 lookup
 * 수행 → 단일 DAL로 통합 (DRY).
 *
 * - row 없음 → null (신청 전 상태)
 * - row 있고 store 없음 → verificationStatus: null
 */
export async function findStoreStatusByUserId(
  db: DbClient,
  userId: string,
): Promise<{ storeId: string; verificationStatus: string | null } | null> {
  const owner = await findByUserId(db, userId);
  if (!owner) return null;
  const [store] = await db
    .select({ verificationStatus: stores.verificationStatus })
    .from(stores)
    .where(eq(stores.id, owner.storeId));
  return {
    storeId: owner.storeId,
    verificationStatus: store?.verificationStatus ?? null,
  };
}

/**
 * Phase 1-γ.1 — KYC 결과 알림용 owner notify target lookup.
 *
 * storeId 기준으로 매장 owner (role='owner', 매니저 제외)의 user_id + email +
 * store name을 단일 join 쿼리로 조회. `approveStoreKyc`·`rejectStoreKyc`
 * 액션이 알림 발송 직전에 호출.
 *
 * 한 매장에 owner 행이 여러 개(드물지만 composite PK상 가능)면 첫 행 반환.
 * 매니저만 있고 owner 없으면 null — KYC 결과는 owner 책임이므로 매니저에게
 * 발송 안 함 (Phase 1-γ.1 단순화).
 *
 * Locale은 DB에 미저장 → 호출자가 admin 세션 locale로 기본값 사용. 향후
 * users.preferredLocale 컬럼 추가 시 select에 추가 (signature 호환 유지 가능).
 */
export async function findOwnerNotifyTargetByStoreId(
  db: DbClient,
  storeId: string,
): Promise<{ userId: string; email: string; storeName: string } | null> {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      storeName: stores.name,
    })
    .from(storeOwners)
    .innerJoin(users, eq(users.id, storeOwners.userId))
    .innerJoin(stores, eq(stores.id, storeOwners.storeId))
    .where(and(eq(storeOwners.storeId, storeId), eq(storeOwners.role, "owner")))
    .limit(1);
  return rows[0] ?? null;
}
