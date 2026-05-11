import "server-only";

import {
  and,
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

export type ServiceInput = {
  nameKo: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameZhCn?: string | null;
  nameZhTw?: string | null;
  nameVi?: string | null;
  priceKrw: number;
  durationMinutes?: number | null;
  category?: string | null;
};

/**
 * Plan v3 M3.1 — 매장 시술 신규 생성. caller가 storeId match 검증 (server
 * action에서 `requireStoreOwnerAuth().storeId` 사용).
 */
export async function createService(
  db: DbClient,
  storeId: string,
  input: ServiceInput,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(services)
    .values({ storeId, ...input })
    .returning({ id: services.id });
  if (!row) throw new Error("createService: insert returned no row");
  return row;
}

/**
 * Plan v3 M3.1 — 매장 시술 수정. `storeId` match 이중 검증 (DAL + server action).
 */
export async function updateService(
  db: DbClient,
  input: { id: string; storeId: string } & ServiceInput,
): Promise<Service | null> {
  const { id, storeId, ...patch } = input;
  const [row] = await db
    .update(services)
    .set(patch)
    .where(and(eq(services.id, id), eq(services.storeId, storeId)))
    .returning();
  return row ?? null;
}

/**
 * Plan v3 M3.1 — 매장 시술 삭제. `storeId` match 이중 검증. 사용 중 검사는
 * server action에서 (countBookingsByService).
 */
export async function deleteService(
  db: DbClient,
  input: { id: string; storeId: string },
): Promise<{ deleted: boolean }> {
  const rows = await db
    .delete(services)
    .where(and(eq(services.id, input.id), eq(services.storeId, input.storeId)))
    .returning({ id: services.id });
  return { deleted: rows.length > 0 };
}
