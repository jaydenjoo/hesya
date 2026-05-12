import "server-only";

import {
  and,
  bookings,
  conversations,
  count,
  customers,
  desc,
  disputes,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  ne,
  stores,
  sum,
  type DbClient,
} from "@hesya/database";

/**
 * Epic 4 (ε phase) — 매장 운영 대시보드 DAL.
 *
 * **현 시점 측정 가능 KPI만 함수 정의** (Epic 2/3 미구현):
 * - 미응답 인박스 합계 (E1, conversations.unread_count sum)
 * - 진행 중 분쟁 건수 (E12-4, disputes.status IN open/in_review)
 * - 매장 KYC 검증 상태 (E9, stores.verification_status)
 *
 * 나머지 9개 KPI (재방문률 / 매출 / 객단가 / 노쇼율 / NPS / 국적 분포 / 시술
 * 분포 / 디자이너 분포 / 결제 미수)는 Epic 2/3 (payments / bookings) 도입 후
 * 별 phase에서 추가.
 */

export interface InboxLoadSummary {
  /** 매장의 모든 conversation unread_count 합 (전체 미응답 메시지 수) */
  unreadMessages: number;
  /** open status 대화 thread 수 */
  openThreads: number;
}

export async function getInboxLoad(
  db: DbClient,
  storeId: string,
): Promise<InboxLoadSummary> {
  const [unreadRow] = await db
    .select({
      unread: sum(conversations.unreadCount).mapWith(Number),
      threads: count(conversations.id).mapWith(Number),
    })
    .from(conversations)
    .where(
      and(eq(conversations.storeId, storeId), eq(conversations.status, "open")),
    );

  return {
    unreadMessages: unreadRow?.unread ?? 0,
    openThreads: unreadRow?.threads ?? 0,
  };
}

export interface DisputeLoadSummary {
  /** open + in_review 합 — 매장 측 처리 필요 */
  active: number;
  /** sla_exceeded — 운영자 개입 임박 */
  slaExceeded: number;
}

export async function getDisputeLoad(
  db: DbClient,
  storeId: string,
): Promise<DisputeLoadSummary> {
  const [activeRow] = await db
    .select({ n: count(disputes.id).mapWith(Number) })
    .from(disputes)
    .where(
      and(
        eq(disputes.storeId, storeId),
        inArray(disputes.status, ["open", "in_review"]),
      ),
    );

  const [slaRow] = await db
    .select({ n: count(disputes.id).mapWith(Number) })
    .from(disputes)
    .where(
      and(eq(disputes.storeId, storeId), eq(disputes.status, "sla_exceeded")),
    );

  return {
    active: activeRow?.n ?? 0,
    slaExceeded: slaRow?.n ?? 0,
  };
}

/**
 * 이번 달 시작/끝 — Asia/Seoul 기준. dashboard 기간 필터의 1차 stub
 * (week/quarter는 별 PR).
 */
export function getCurrentMonthRange(now = new Date()): {
  fromDate: Date;
  toDate: Date;
} {
  const fromDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
  );
  const toDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
  );
  return { fromDate, toDate };
}

export type KycVerificationStatus =
  | "pending"
  | "auto_approved"
  | "manual_review"
  | "rejected"
  | "unknown";

export async function getKycStatus(
  db: DbClient,
  storeId: string,
): Promise<KycVerificationStatus> {
  const [row] = await db
    .select({ status: stores.verificationStatus })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  const raw = row?.status ?? null;
  if (
    raw === "pending" ||
    raw === "auto_approved" ||
    raw === "manual_review" ||
    raw === "rejected"
  ) {
    return raw;
  }
  return "unknown";
}

/**
 * Plan v3 ε Epic 4 KPI — 이번 달 매출 + 객단가 + 노쇼율.
 *
 * 매출은 status != 'cancelled' booking의 totalPriceKrw 합.
 * 노쇼율은 status='no_show' / 비-cancelled 합. 분모 0이면 0 반환.
 */
export interface MonthlyBookingStats {
  revenueKrw: number;
  bookingCount: number;
  averageOrderKrw: number;
  noShowCount: number;
  noShowRatePct: number;
}

export async function getMonthlyBookingStats(
  db: DbClient,
  storeId: string,
  range: { fromDate: Date; toDate: Date },
): Promise<MonthlyBookingStats> {
  const [agg] = await db
    .select({
      revenue: sum(bookings.totalPriceKrw).mapWith(Number),
      n: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.storeId, storeId),
        ne(bookings.status, "cancelled"),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    );
  const [noShow] = await db
    .select({ n: count(bookings.id).mapWith(Number) })
    .from(bookings)
    .where(
      and(
        eq(bookings.storeId, storeId),
        eq(bookings.status, "no_show"),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    );
  const revenue = agg?.revenue ?? 0;
  const total = agg?.n ?? 0;
  const noShowCount = noShow?.n ?? 0;
  return {
    revenueKrw: revenue,
    bookingCount: total,
    averageOrderKrw: total > 0 ? Math.round(revenue / total) : 0,
    noShowCount,
    noShowRatePct: total > 0 ? Math.round((noShowCount / total) * 100) : 0,
  };
}

/**
 * Plan v3 ε Epic 4 KPI — 이번 달 booking 손님의 국적 분포.
 *
 * bookings JOIN customers, customers.nationality 그룹 별 count. nationality
 * 미설정(null)은 'unknown'으로 라벨. cancelled 제외.
 */
export interface NationalityMixRow {
  nationality: string;
  count: number;
}

export async function getNationalityMix(
  db: DbClient,
  storeId: string,
  range: { fromDate: Date; toDate: Date },
): Promise<NationalityMixRow[]> {
  const rows = await db
    .select({
      nationality: customers.nationality,
      n: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        eq(bookings.storeId, storeId),
        ne(bookings.status, "cancelled"),
        isNotNull(bookings.customerId),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    )
    .groupBy(customers.nationality)
    .orderBy(desc(count(bookings.id)));
  return rows.map((r) => ({
    nationality: r.nationality?.trim() || "unknown",
    count: r.n,
  }));
}
