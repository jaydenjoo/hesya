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
  messages,
  ne,
  stores,
  storeDeletionRequests,
  sum,
  type DbClient,
} from "@hesya/database";
import { estimateCostKrw } from "@/lib/ai-cost/model-pricing";

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

export interface MonthlyNewStoresRow {
  /** 한국어 월 label — "5월" 등 */
  month: string;
  /** 해당 월 신규 매장 수 (soft-deleted 제외) */
  value: number;
}

/**
 * 최근 12개월 신규 매장 추이 (dashboard bar chart 위젯).
 *
 * `stores.createdAt` 기준 month bucket. soft-deleted (deletedAt NOT NULL) 제외.
 * 12개월 array — 데이터 없는 달은 value=0 (차트가 12개 bar를 모두 그림).
 */
export async function getMonthlyNewStoresCounts(
  db: DbClient,
  now: Date = new Date(),
): Promise<MonthlyNewStoresRow[]> {
  const twelveMonthsAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );

  const rows = await db
    .select({
      createdAt: stores.createdAt,
    })
    .from(stores)
    .where(
      and(gte(stores.createdAt, twelveMonthsAgo), isNull(stores.deletedAt)),
    );

  const bucket = new Map<string, number>();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = `${r.createdAt.getUTCFullYear()}-${r.createdAt.getUTCMonth()}`;
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }

  const monthFmt = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    timeZone: "Asia/Seoul",
  });
  const result: MonthlyNewStoresRow[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    result.push({
      month: monthFmt.format(d),
      value: bucket.get(key) ?? 0,
    });
  }
  return result;
}

export interface DailyAiCostSparkRow {
  /** 0..N-1 — sparkline x index */
  d: number;
  /** 일별 추정 cost (KRW) */
  v: number;
}

/**
 * 최근 30일 일별 AI 추정 cost (sparkline 위젯).
 *
 * `messages.aiModel` × 모델별 평균 단가. 메시지 0건 day는 v=0.
 * ai-cost.ts의 `getAiCostSummary` last14Days 패턴을 30일로 확장.
 */
export async function getDailyAiCostSpark(
  db: DbClient,
  now: Date = new Date(),
): Promise<DailyAiCostSparkRow[]> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      model: messages.aiModel,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        isNotNull(messages.aiModel),
        gte(messages.createdAt, thirtyDaysAgo),
        lte(messages.createdAt, now),
      ),
    );

  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = formatDateKstYmd(r.createdAt);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + estimateCostKrw(r.model));
  }

  const result: DailyAiCostSparkRow[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = formatDateKstYmd(day);
    result.push({ d: 29 - i, v: Math.round(dailyMap.get(key) ?? 0) });
  }
  return result;
}

function formatDateKstYmd(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}
