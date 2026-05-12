import "server-only";
import {
  and,
  apiPolicyAlerts,
  bookings,
  count,
  customers,
  desc,
  disputes,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  kycVerificationLogs,
  lte,
  ne,
  stores,
  storeDeletionRequests,
  sum,
  type DbClient,
} from "@hesya/database";

/**
 * Plan v3 M4.3 — admin 통합 대시보드 DAL.
 *
 * 4 alert chip + 4 KPI tile + 최근 audit trail.
 *
 * 축소 scope (Phase 2 보류):
 *   - 월별 신규 매장 bar chart
 *   - 지역별 매장 분포 Korea map
 *   - Top 5 카테고리
 *   - AI cost sparkline (M4.4와 통합)
 */

export interface AdminAlertCounts {
  /** 매뉴얼 검토 대기 KYC */
  pendingKyc: number;
  /** 진행 중 분쟁 (open + in_review) */
  openDisputes: number;
  /** 미처리 API 정책 알림 */
  newApiPolicyAlerts: number;
  /** 미처리 매장 삭제 요청 (cancelled 안 된) */
  pendingStoreDeletions: number;
}

export async function getAdminAlertCounts(
  db: DbClient,
): Promise<AdminAlertCounts> {
  const [kycRow] = await db
    .select({ n: count(stores.id).mapWith(Number) })
    .from(stores)
    .where(
      and(
        eq(stores.verificationStatus, "manual_review"),
        isNull(stores.deletedAt),
      ),
    );
  const [disputeRow] = await db
    .select({ n: count(disputes.id).mapWith(Number) })
    .from(disputes)
    .where(inArray(disputes.status, ["open", "in_review"]));
  const [alertRow] = await db
    .select({ n: count(apiPolicyAlerts.id).mapWith(Number) })
    .from(apiPolicyAlerts)
    .where(eq(apiPolicyAlerts.status, "new"));
  const [deletionRow] = await db
    .select({ n: count(storeDeletionRequests.id).mapWith(Number) })
    .from(storeDeletionRequests)
    .where(isNull(storeDeletionRequests.cancelledAt));

  return {
    pendingKyc: kycRow?.n ?? 0,
    openDisputes: disputeRow?.n ?? 0,
    newApiPolicyAlerts: alertRow?.n ?? 0,
    pendingStoreDeletions: deletionRow?.n ?? 0,
  };
}

export interface AdminKpiSummary {
  /** auto_approved + non-soft-deleted */
  activeStores: number;
  /** verificationStatus IN (auto_approved, manual_review) — 모든 등록 매장 */
  totalRegistered: number;
  /** 오늘 createdAt 매장 */
  newStoresToday: number;
  /** 이번 달 전체 매장의 booking 매출 합 (cancelled 제외) */
  foreignGmvMtdKrw: number;
  /** 이번 달 booking 수 */
  foreignBookingsMtd: number;
  /** 외국인 손님 분포 (booking customers.nationality 그룹) */
  foreignBookingsByNationality: Array<{ nationality: string; count: number }>;
}

export async function getAdminKpiSummary(
  db: DbClient,
  range: { fromDate: Date; toDate: Date },
): Promise<AdminKpiSummary> {
  const [activeRow] = await db
    .select({ n: count(stores.id).mapWith(Number) })
    .from(stores)
    .where(
      and(
        eq(stores.verificationStatus, "auto_approved"),
        isNull(stores.deletedAt),
      ),
    );
  const [totalRow] = await db
    .select({ n: count(stores.id).mapWith(Number) })
    .from(stores)
    .where(
      and(
        inArray(stores.verificationStatus, ["auto_approved", "manual_review"]),
        isNull(stores.deletedAt),
      ),
    );

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [todayRow] = await db
    .select({ n: count(stores.id).mapWith(Number) })
    .from(stores)
    .where(and(gte(stores.createdAt, todayStart), isNull(stores.deletedAt)));

  const [gmvRow] = await db
    .select({
      revenue: sum(bookings.totalPriceKrw).mapWith(Number),
      n: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "cancelled"),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    );

  const nationalityRows = await db
    .select({
      nationality: customers.nationality,
      n: count(bookings.id).mapWith(Number),
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        ne(bookings.status, "cancelled"),
        isNotNull(bookings.customerId),
        gte(bookings.scheduledAt, range.fromDate),
        lte(bookings.scheduledAt, range.toDate),
      ),
    )
    .groupBy(customers.nationality)
    .orderBy(desc(count(bookings.id)));

  return {
    activeStores: activeRow?.n ?? 0,
    totalRegistered: totalRow?.n ?? 0,
    newStoresToday: todayRow?.n ?? 0,
    foreignGmvMtdKrw: gmvRow?.revenue ?? 0,
    foreignBookingsMtd: gmvRow?.n ?? 0,
    foreignBookingsByNationality: nationalityRows.map((r) => ({
      nationality: r.nationality?.trim() || "unknown",
      count: r.n,
    })),
  };
}

export interface AuditTrailEntry {
  id: string;
  /** kyc | dispute */
  kind: "kyc" | "dispute";
  /** 한 줄 요약 (event_type for kyc, status for dispute) */
  summary: string;
  /** 추가 컨텍스트 (예: store name, dispute id) */
  context: string | null;
  occurredAt: Date;
}

/**
 * 최근 admin 감사 활동 — kyc-verification-logs + disputes 최근 status 변경.
 *
 * 두 source 합쳐 시간순 정렬. 단순 구현으로 각 source N건 가져와 merge.
 */
export async function getAdminAuditTrail(
  db: DbClient,
  limit = 20,
): Promise<AuditTrailEntry[]> {
  const kycRows = await db
    .select({
      id: kycVerificationLogs.id,
      eventType: kycVerificationLogs.eventType,
      eventData: kycVerificationLogs.eventData,
      occurredAt: kycVerificationLogs.createdAt,
    })
    .from(kycVerificationLogs)
    .orderBy(desc(kycVerificationLogs.createdAt))
    .limit(limit);

  const disputeRows = await db
    .select({
      id: disputes.id,
      status: disputes.status,
      category: disputes.category,
      occurredAt: disputes.updatedAt,
    })
    .from(disputes)
    .where(inArray(disputes.status, ["resolved", "rejected", "in_review"]))
    .orderBy(desc(disputes.updatedAt))
    .limit(limit);

  const entries: AuditTrailEntry[] = [
    ...kycRows.map(
      (r): AuditTrailEntry => ({
        id: r.id,
        kind: "kyc" as const,
        summary: r.eventType,
        context:
          typeof r.eventData === "object" && r.eventData !== null
            ? JSON.stringify(r.eventData).slice(0, 80)
            : null,
        occurredAt: r.occurredAt,
      }),
    ),
    ...disputeRows.map(
      (r): AuditTrailEntry => ({
        id: r.id,
        kind: "dispute" as const,
        summary: `dispute:${r.status}`,
        context: r.category,
        occurredAt: r.occurredAt,
      }),
    ),
  ];

  return entries
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}
