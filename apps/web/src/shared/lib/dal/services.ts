import "server-only";

import {
  asc,
  eq,
  inArray,
  services,
  type DbClient,
  type Service,
} from "@hesya/database";

/**
 * Epic 3 (δ phase) — services DAL (owner-side read).
 *
 * Customer-side는 phase ζ에서 다국어 customer 페이지와 결합.
 */
export async function listServicesByStore(
  db: DbClient,
  storeId: string,
): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(eq(services.storeId, storeId))
    .orderBy(asc(services.nameKo));
}

export async function listServicesByIds(
  db: DbClient,
  ids: ReadonlyArray<string>,
): Promise<Service[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(services)
    .where(inArray(services.id, ids as string[]));
}
