import "server-only";

import {
  and,
  asc,
  bookings,
  count,
  eq,
  gte,
  inArray,
  lte,
  type Booking,
  type DbClient,
} from "@hesya/database";

/**
 * Epic 3 (δ phase) — booking DAL (owner-side).
 *
 * Customer-side 생성 / 결제 30% Escrow / 다국어 페이지 / 슬롯 동기화는 phase ζ
 * (베타 매장 매칭) + Epic 2 결제 도입 후. 본 DAL은 owner가 이미 IG DM 등으로
 * 받은 예약을 추적·상태 변경하는 데 집중.
 *
 * status convention (PRD §284 + 분쟁 `no_show` 일관):
 * - `scheduled` — 예약 확정, 시간 도래 전
 * - `completed` — 완료
 * - `cancelled` — 취소
 * - `no_show` — 노쇼 (분쟁 카테고리와 동일 단어)
 */

export type BookingStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export const BOOKING_STATUSES: ReadonlyArray<BookingStatus> = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

export type BookingFilter = BookingStatus | "all";

export interface ListBookingsOpts {
  filter?: BookingFilter;
  /** `scheduledAt >= fromDate` */
  fromDate?: Date;
  /** `scheduledAt <= toDate` */
  toDate?: Date;
  limit?: number;
}

export async function listBookingsByStore(
  db: DbClient,
  storeId: string,
  opts: ListBookingsOpts = {},
): Promise<Booking[]> {
  const conds = [eq(bookings.storeId, storeId)];
  if (opts.filter && opts.filter !== "all") {
    conds.push(eq(bookings.status, opts.filter));
  }
  if (opts.fromDate) {
    conds.push(gte(bookings.scheduledAt, opts.fromDate));
  }
  if (opts.toDate) {
    conds.push(lte(bookings.scheduledAt, opts.toDate));
  }
  return db
    .select()
    .from(bookings)
    .where(and(...conds))
    .orderBy(asc(bookings.scheduledAt))
    .limit(opts.limit ?? 100);
}

export async function getBooking(
  db: DbClient,
  id: string,
): Promise<Booking | null> {
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateBookingStatus(
  db: DbClient,
  input: { id: string; storeId: string; status: BookingStatus },
): Promise<Booking | null> {
  const [row] = await db
    .update(bookings)
    .set({ status: input.status })
    .where(and(eq(bookings.id, input.id), eq(bookings.storeId, input.storeId)))
    .returning();
  return row ?? null;
}

export interface BookingCountByGroup {
  /** group key (serviceId / staffId) */
  key: string;
  /** display label (service name_ko / staff name) */
  label: string;
  /** booking count */
  count: number;
}

/**
 * 디자이너(staff)별 booking 분포 — Epic 4 dashboard KPI wire.
 *
 * scheduledAt 기준 fromDate ~ toDate 범위 (포함). status 무관 (전체 분포).
 */
export async function countBookingsByStaff(
  db: DbClient,
  storeId: string,
  range: { fromDate: Date; toDate: Date },
): Promise<BookingCountByGroup[]> {
  const rows = await db
    .select({
      key: bookings.staffId,
      count: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.storeId, storeId),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    )
    .groupBy(bookings.staffId);

  return rows
    .filter((r): r is { key: string; count: number } => r.key !== null)
    .map((r) => ({ key: r.key, label: "", count: r.count }));
}

export async function countBookingsByService(
  db: DbClient,
  storeId: string,
  range: { fromDate: Date; toDate: Date },
): Promise<BookingCountByGroup[]> {
  const rows = await db
    .select({
      key: bookings.serviceId,
      count: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.storeId, storeId),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    )
    .groupBy(bookings.serviceId);

  return rows
    .filter((r): r is { key: string; count: number } => r.key !== null)
    .map((r) => ({ key: r.key, label: "", count: r.count }));
}

export { inArray };
