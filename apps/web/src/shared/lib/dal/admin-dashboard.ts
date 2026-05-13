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
  services,
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

/**
 * 분쟁 SLA 처리율 위젯 — 최근 N일 resolved disputes 중 SLA 안에 처리된 비율.
 *
 * 분모: 기간 내 resolvedAt이 있는 disputes (status='resolved' 또는 'rejected'
 *       이면서 resolvedAt NOT NULL — 완결된 분쟁).
 * 분자: 위 중 resolvedAt <= slaDueAt (SLA 준수).
 *
 * 분모 0이면 pct=0 + empty=true (위젯에서 "측정 가능 자료 없음" 표시).
 */
export interface DisputeSlaResolution {
  /** SLA 안에 처리된 건수 */
  withinSla: number;
  /** 기간 내 완결된 분쟁 총 건수 (resolvedAt NOT NULL) */
  totalResolved: number;
  /** 0..100 (정수, 반올림) */
  pct: number;
  /** 분모 0이면 true — 위젯이 빈 데이터 fallback 분기 */
  empty: boolean;
}

export async function getDisputeSlaResolution(
  db: DbClient,
  days = 30,
  now: Date = new Date(),
): Promise<DisputeSlaResolution> {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      resolvedAt: disputes.resolvedAt,
      slaDueAt: disputes.slaDueAt,
    })
    .from(disputes)
    .where(
      and(
        isNotNull(disputes.resolvedAt),
        gte(disputes.resolvedAt, since),
        lte(disputes.resolvedAt, now),
      ),
    );

  const totalResolved = rows.length;
  if (totalResolved === 0) {
    return { withinSla: 0, totalResolved: 0, pct: 0, empty: true };
  }
  const withinSla = rows.filter(
    (r) =>
      r.resolvedAt !== null &&
      r.slaDueAt !== null &&
      r.resolvedAt.getTime() <= r.slaDueAt.getTime(),
  ).length;
  const pct = Math.round((withinSla / totalResolved) * 100);
  return { withinSla, totalResolved, pct, empty: false };
}

/**
 * 17 시도 코드 (KOSIS).
 *
 * x/y는 100×100 viewBox 정규화 좌표 — Korea heatmap SVG에서 dot 위치.
 * dashboard-korea-map.tsx의 기존 hardcoded 좌표와 동일하게 유지.
 */
const KOREA_REGIONS = [
  { code: "11", name: "서울", x: 38, y: 32 },
  { code: "26", name: "부산", x: 64, y: 70 },
  { code: "27", name: "대구", x: 56, y: 58 },
  { code: "28", name: "인천", x: 30, y: 33 },
  { code: "29", name: "광주", x: 40, y: 70 },
  { code: "30", name: "대전", x: 44, y: 50 },
  { code: "31", name: "울산", x: 66, y: 62 },
  { code: "36", name: "세종", x: 42, y: 46 },
  { code: "41", name: "경기", x: 42, y: 35 },
  { code: "42", name: "강원", x: 56, y: 26 },
  { code: "43", name: "충북", x: 48, y: 44 },
  { code: "44", name: "충남", x: 36, y: 47 },
  { code: "45", name: "전북", x: 38, y: 60 },
  { code: "46", name: "전남", x: 36, y: 72 },
  { code: "47", name: "경북", x: 58, y: 50 },
  { code: "48", name: "경남", x: 54, y: 68 },
  { code: "50", name: "제주", x: 32, y: 88 },
] as const;

/**
 * stores.region 자유 입력(예: "서울 강남구") → 시도 코드 정규화.
 *
 * 첫 단어가 시도 alias이면 매칭. 없으면 null (unknown 버킷).
 * 영문/구버전 명칭(강원도, 강원특별자치도)도 동일 시도로 묶음.
 */
const REGION_ALIASES: ReadonlyMap<string, string> = new Map([
  ["서울", "11"],
  ["서울특별시", "11"],
  ["부산", "26"],
  ["부산광역시", "26"],
  ["대구", "27"],
  ["대구광역시", "27"],
  ["인천", "28"],
  ["인천광역시", "28"],
  ["광주", "29"],
  ["광주광역시", "29"],
  ["대전", "30"],
  ["대전광역시", "30"],
  ["울산", "31"],
  ["울산광역시", "31"],
  ["세종", "36"],
  ["세종특별자치시", "36"],
  ["경기", "41"],
  ["경기도", "41"],
  ["강원", "42"],
  ["강원도", "42"],
  ["강원특별자치도", "42"],
  ["충북", "43"],
  ["충청북도", "43"],
  ["충남", "44"],
  ["충청남도", "44"],
  ["전북", "45"],
  ["전라북도", "45"],
  ["전북특별자치도", "45"],
  ["전남", "46"],
  ["전라남도", "46"],
  ["경북", "47"],
  ["경상북도", "47"],
  ["경남", "48"],
  ["경상남도", "48"],
  ["제주", "50"],
  ["제주도", "50"],
  ["제주특별자치도", "50"],
]);

export function normalizeRegionToCode(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const firstToken = trimmed.split(/\s+/)[0]!;
  return REGION_ALIASES.get(firstToken) ?? null;
}

export interface StoreRegionRow {
  /** KOSIS 시도 코드 */
  readonly code: string;
  /** 한국어 시도 이름 */
  readonly name: string;
  /** 매장 수 (auto_approved + 미삭제) */
  readonly stores: number;
  /** SVG viewBox 좌표 (heatmap dot 위치) */
  readonly x: number;
  readonly y: number;
}

export interface StoreRegionDistribution {
  /** 17개 시도 row — region 0건이라도 항목 유지 (stores=0) */
  readonly regions: readonly StoreRegionRow[];
  /** 활성 매장 중 region 매칭 안 된 수 */
  readonly unknown: number;
  /** regions.stores 합 0 + unknown 0이면 true */
  readonly empty: boolean;
}

/**
 * 지역별 활성 매장 분포 — 17 시도 + unknown 버킷.
 *
 * 분자: stores.verificationStatus='auto_approved' + deletedAt NULL.
 * 정규화: 첫 단어가 시도 alias 매칭하면 해당 code, 아니면 unknown.
 * 17 시도 모두 row 유지 (0건이어도) — UI dot grid가 항상 17개 그림.
 */
export async function getStoreRegionDistribution(
  db: DbClient,
): Promise<StoreRegionDistribution> {
  const rows = await db
    .select({ region: stores.region })
    .from(stores)
    .where(
      and(
        eq(stores.verificationStatus, "auto_approved"),
        isNull(stores.deletedAt),
      ),
    );

  const counts = new Map<string, number>();
  let unknown = 0;
  for (const r of rows) {
    const code = normalizeRegionToCode(r.region);
    if (code === null) {
      unknown += 1;
      continue;
    }
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const regions: StoreRegionRow[] = KOREA_REGIONS.map((r) => ({
    code: r.code,
    name: r.name,
    stores: counts.get(r.code) ?? 0,
    x: r.x,
    y: r.y,
  }));

  const totalMatched = regions.reduce((sum, r) => sum + r.stores, 0);
  return {
    regions,
    unknown,
    empty: totalMatched === 0 && unknown === 0,
  };
}

/**
 * Top N 카테고리 (GMV 기준) 위젯 — 최근 N일 booking GMV를 services.category 합산.
 *
 * bookings INNER JOIN services. cancelled 제외. category NULL은 'uncategorized'
 * 라벨로 묶음. shareRatio는 1위 대비 비율 (0..1).
 *
 * Epic 2 (결제) 정식 도입 전이라 bookings.totalPriceKrw가 booking 신청 시점
 * 가격일 수 있음. 정확한 GMV는 결제 도입 후. 그때까지는 booking 가격 합산을
 * 임시 GMV로 사용.
 */
export interface TopCategoryRow {
  readonly name: string;
  readonly gmvKrw: number;
  readonly shareRatio: number;
}

export async function getTopCategoriesByGmv(
  db: DbClient,
  limit = 5,
  days = 30,
  now: Date = new Date(),
): Promise<readonly TopCategoryRow[]> {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      category: services.category,
      gmv: sum(bookings.totalPriceKrw).mapWith(Number),
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        ne(bookings.status, "cancelled"),
        gte(bookings.scheduledAt, since),
        lte(bookings.scheduledAt, now),
      ),
    )
    .groupBy(services.category)
    .orderBy(desc(sum(bookings.totalPriceKrw)))
    .limit(limit);

  if (rows.length === 0) return [];
  const top = rows[0]!.gmv || 0;
  return rows.map((r) => {
    const gmv = r.gmv ?? 0;
    return {
      name: r.category?.trim() || "기타",
      gmvKrw: gmv,
      shareRatio: top > 0 ? gmv / top : 0,
    };
  });
}
