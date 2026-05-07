import "server-only";
import { eq, storeOwners, stores, type DbClient } from "@hesya/database";

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
