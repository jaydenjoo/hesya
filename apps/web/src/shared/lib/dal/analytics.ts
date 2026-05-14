import "server-only";

import {
  and,
  bookings,
  count,
  customers,
  desc,
  eq,
  gte,
  isNotNull,
  ne,
  services,
  sql,
  staff,
  sum,
  type DbClient,
} from "@hesya/database";

/**
 * Plan v4 Sprint 1 Epic E — Owner Analytics DAL.
 *
 * 매장 owner가 `/store/analytics`에서 보는 5개 차트:
 * 1. 월별 매출 (최근 6개월 bookings.total_price_krw sum, status≠cancelled)
 * 2. 국적 분포 (customers.nationality COUNT, store에 연관된 booking 보유자만)
 * 3. 시술 TOP5 (bookings → services 그룹 by name, count desc)
 * 4. 디자이너 TOP5 (bookings → staff 그룹 by name, count desc)
 * 5. 재방문률 KPI (customers.total_visits ≥ 2 / 전체 customer 비율)
 *
 * 모두 기존 bookings/customers/services/staff 테이블만 사용. 스키마 변경 0.
 * service-role direct connection 사용 (RLS bypass) — store_id 입력은 가드에서 검증.
 */

export interface MonthlyRevenuePoint {
  /** YYYY-MM */
  month: string;
  revenueKrw: number;
  bookingCount: number;
}

/**
 * 최근 N개월 매출. cancelled 제외. timestamp truncated to month.
 */
export async function getMonthlyRevenue(
  db: DbClient,
  storeId: string,
  months = 6,
): Promise<MonthlyRevenuePoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${bookings.scheduledAt}), 'YYYY-MM')`,
      revenue: sum(bookings.totalPriceKrw).mapWith(Number),
      n: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.storeId, storeId),
        gte(bookings.scheduledAt, since),
        ne(bookings.status, "cancelled"),
      ),
    )
    .groupBy(sql`date_trunc('month', ${bookings.scheduledAt})`)
    .orderBy(sql`date_trunc('month', ${bookings.scheduledAt})`);

  return rows.map((r) => ({
    month: r.month,
    revenueKrw: r.revenue ?? 0,
    bookingCount: r.n ?? 0,
  }));
}

export interface NationalitySlice {
  nationality: string;
  count: number;
}

/**
 * 매장 방문 customer의 nationality 분포. NULL 제외.
 * Distinct customer 기준 (한 사람이 N번 방문해도 1).
 */
export async function getNationalityBreakdown(
  db: DbClient,
  storeId: string,
): Promise<NationalitySlice[]> {
  const rows = await db
    .selectDistinct({
      customerId: customers.id,
      nationality: customers.nationality,
    })
    .from(customers)
    .innerJoin(bookings, eq(bookings.customerId, customers.id))
    .where(
      and(eq(bookings.storeId, storeId), isNotNull(customers.nationality)),
    );

  const buckets = new Map<string, number>();
  for (const r of rows) {
    if (!r.nationality) continue;
    buckets.set(r.nationality, (buckets.get(r.nationality) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([nationality, count]) => ({ nationality, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ServiceRank {
  serviceName: string;
  bookingCount: number;
  revenueKrw: number;
}

/**
 * 시술 TOP N (booking count desc). cancelled 제외.
 */
export async function getTopServices(
  db: DbClient,
  storeId: string,
  limit = 5,
): Promise<ServiceRank[]> {
  const rows = await db
    .select({
      serviceName: services.nameKo,
      n: count(bookings.id).mapWith(Number),
      revenue: sum(bookings.totalPriceKrw).mapWith(Number),
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.storeId, storeId), ne(bookings.status, "cancelled")))
    .groupBy(services.nameKo)
    .orderBy(desc(count(bookings.id)))
    .limit(limit);

  return rows.map((r) => ({
    serviceName: r.serviceName ?? "—",
    bookingCount: r.n ?? 0,
    revenueKrw: r.revenue ?? 0,
  }));
}

export interface StaffRank {
  staffName: string;
  bookingCount: number;
  revenueKrw: number;
}

export async function getTopStaff(
  db: DbClient,
  storeId: string,
  limit = 5,
): Promise<StaffRank[]> {
  const rows = await db
    .select({
      staffName: staff.name,
      n: count(bookings.id).mapWith(Number),
      revenue: sum(bookings.totalPriceKrw).mapWith(Number),
    })
    .from(bookings)
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(and(eq(bookings.storeId, storeId), ne(bookings.status, "cancelled")))
    .groupBy(staff.name)
    .orderBy(desc(count(bookings.id)))
    .limit(limit);

  return rows.map((r) => ({
    staffName: r.staffName ?? "—",
    bookingCount: r.n ?? 0,
    revenueKrw: r.revenue ?? 0,
  }));
}

export interface RepeatRateSummary {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
}

/**
 * 재방문률 = total_visits ≥ 2 customer 수 / 매장 booking 보유 distinct customer 수.
 */
export async function getRepeatRate(
  db: DbClient,
  storeId: string,
): Promise<RepeatRateSummary> {
  const totalRows = await db
    .selectDistinct({ id: customers.id, visits: customers.totalVisits })
    .from(customers)
    .innerJoin(bookings, eq(bookings.customerId, customers.id))
    .where(eq(bookings.storeId, storeId));

  const totalCustomers = totalRows.length;
  const repeatCustomers = totalRows.filter((r) => (r.visits ?? 0) >= 2).length;
  const repeatRate =
    totalCustomers === 0 ? 0 : repeatCustomers / totalCustomers;

  return { totalCustomers, repeatCustomers, repeatRate };
}
