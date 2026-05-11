import "server-only";

import {
  asc,
  eq,
  inArray,
  staff,
  type DbClient,
  type Staff,
} from "@hesya/database";

/**
 * Epic 3 (δ phase) — staff(디자이너) DAL (owner-side read).
 *
 * 포트폴리오 다국어 / customer-side 표시는 phase ζ.
 */
export async function listStaffByStore(
  db: DbClient,
  storeId: string,
): Promise<Staff[]> {
  return db
    .select()
    .from(staff)
    .where(eq(staff.storeId, storeId))
    .orderBy(asc(staff.name));
}

export async function listStaffByIds(
  db: DbClient,
  ids: ReadonlyArray<string>,
): Promise<Staff[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(staff)
    .where(inArray(staff.id, ids as string[]));
}
