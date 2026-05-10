import "server-only";

import {
  and,
  gte,
  lte,
  payments,
  type DbClient,
  type Payment,
} from "@hesya/database";

/**
 * E12-6 결제이상 모니터링용 DAL.
 *
 * Epic 2(결제 위젯) 17%(스키마만, 데이터 0건) 단계 인프라. payments 테이블에
 * 데이터가 들어오기 시작하면 즉시 작동. 본 모듈은 모니터링 전용 read-only —
 * 결제 생성/환불 처리는 Epic 2에서 별도 DAL.
 *
 * 0건 안전: payments 테이블이 비어 있어도 NaN 없이 0 반환 (UI 폭발 방지).
 *
 * 매장별 필터 (storeId)는 Epic 2 도입 시점에 추가 예정.
 * 현재 schema는 payments.bookingId만 있고 storeId direct 컬럼 없음 → 매장별
 * 집계는 bookings join 필요. 베타 운영 데이터 누적 후 denormalize 또는 join
 * 결정. 본 단계는 전체(또는 날짜 범위) 집계만 지원.
 */

/**
 * payments.status 컨벤션 — Epic 2 도입 시 enum으로 narrowing 예정.
 *
 * 본 monitoring 모듈은 "refunded"만 카운트. 다른 상태("succeeded", "pending",
 * "failed")는 무시. Epic 2 시점에 status 표준화 + enum migration + DAL 갱신.
 */
const REFUNDED_STATUS = "refunded";

export interface PaymentMetrics {
  totalCount: number;
  refundCount: number;
  refundRate: number;
  totalAmountKrw: number;
  refundedAmountKrw: number;
}

export interface PaymentMetricsFilter {
  fromDate?: Date;
  toDate?: Date;
}

/**
 * 결제 metrics 집계.
 *
 * SQL aggregate 대신 row fetch + JS 집계 채택 — 베타 5곳 × 일 결제 수십 건
 * 수준이라 row 수가 적음. Epic 2 안정화 + 데이터량 증가 시점에 SQL
 * aggregate(count/sum)로 마이그레이션 예정.
 *
 * @returns 0건 안전 — refundRate 분모 0이면 0 반환 (NaN 차단)
 */
export async function getPaymentMetrics(
  db: DbClient,
  filter: PaymentMetricsFilter = {},
): Promise<PaymentMetrics> {
  const conditions = [
    filter.fromDate ? gte(payments.createdAt, filter.fromDate) : undefined,
    filter.toDate ? lte(payments.createdAt, filter.toDate) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const rows: Payment[] = await db
    .select()
    .from(payments)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return aggregateMetrics(rows);
}

/**
 * row → metrics 집계 (pure function, test 용이).
 *
 * 0건 안전: refundRate 분모가 0이면 0 반환 (Number.isFinite 보장).
 */
export function aggregateMetrics(rows: Payment[]): PaymentMetrics {
  const totalCount = rows.length;
  const refundedRows = rows.filter((r) => r.status === REFUNDED_STATUS);
  const refundCount = refundedRows.length;
  const refundRate = totalCount > 0 ? refundCount / totalCount : 0;
  const totalAmountKrw = rows.reduce((sum, r) => sum + (r.amountKrw ?? 0), 0);
  const refundedAmountKrw = refundedRows.reduce(
    (sum, r) => sum + (r.amountKrw ?? 0),
    0,
  );
  return {
    totalCount,
    refundCount,
    refundRate,
    totalAmountKrw,
    refundedAmountKrw,
  };
}
