/**
 * Mock fixture — admin 통합 dashboard.
 *
 * env.MOCK_FIXTURES=true 일 때 dashboard page.tsx에서 8 DAL 묶음 대신 본 fixture
 * 사용. 외부 데모 단계에서 admin UI 첫인상을 풍부한 데이터로 보여주기 위함.
 * 베타 매장 모집 후 MOCK_FIXTURES=false 토글로 실 DB DAL 자동 fallback.
 *
 * 데이터 shape는 `apps/web/src/shared/lib/dal/admin-dashboard.ts`의
 * 8 return type과 1:1 정합 (drift 시 page.tsx 컴파일 에러로 즉시 검출).
 */
import type {
  AdminAlertCounts,
  AdminKpiSummary,
  AuditTrailEntry,
  DailyAiCostSparkRow,
  DisputeSlaResolution,
  MonthlyNewStoresRow,
  StoreRegionDistribution,
  TopCategoryRow,
} from "@/shared/lib/dal/admin-dashboard";

/* ─── 4 alert chip ─── */
export const mockAdminAlertCounts: AdminAlertCounts = {
  pendingKyc: 7,
  openDisputes: 3,
  newApiPolicyAlerts: 2,
  pendingStoreDeletions: 1,
};

/* ─── 4 KPI tile (이번 달 기준) ─── */
export const mockAdminKpiSummary: AdminKpiSummary = {
  activeStores: 142,
  totalRegistered: 168,
  newStoresToday: 4,
  foreignGmvMtdKrw: 38_420_000,
  foreignBookingsMtd: 218,
  foreignBookingsByNationality: [
    { nationality: "Japan", count: 72 },
    { nationality: "China", count: 48 },
    { nationality: "Taiwan", count: 31 },
    { nationality: "USA", count: 24 },
    { nationality: "Vietnam", count: 18 },
    { nationality: "Thailand", count: 14 },
    { nationality: "Singapore", count: 11 },
  ],
};

/* ─── Audit trail (KYC + dispute 혼합, 최근순) ─── */
const now = Date.now();
const hours = (h: number) => new Date(now - h * 60 * 60 * 1000);

export const mockAdminAuditTrail: AuditTrailEntry[] = [
  {
    id: "evt-001",
    kind: "kyc",
    summary: "kyc.approved",
    context: '{"store":"Atelier Hwa","mode":"auto"}',
    occurredAt: hours(0.3),
  },
  {
    id: "evt-002",
    kind: "dispute",
    summary: "dispute:resolved",
    context: "환불 — 시술 만족도",
    occurredAt: hours(0.8),
  },
  {
    id: "evt-003",
    kind: "kyc",
    summary: "kyc.manual_review",
    context: '{"store":"Salon Vert","reason":"address_mismatch"}',
    occurredAt: hours(2.1),
  },
  {
    id: "evt-004",
    kind: "dispute",
    summary: "dispute:in_review",
    context: "No-show 분쟁",
    occurredAt: hours(4.5),
  },
  {
    id: "evt-005",
    kind: "kyc",
    summary: "kyc.approved",
    context: '{"store":"미용실 별","mode":"auto"}',
    occurredAt: hours(6.2),
  },
  {
    id: "evt-006",
    kind: "dispute",
    summary: "dispute:rejected",
    context: "증빙 부족",
    occurredAt: hours(8.4),
  },
  {
    id: "evt-007",
    kind: "kyc",
    summary: "kyc.submitted",
    context: '{"store":"Heritage Hair Lab"}',
    occurredAt: hours(11),
  },
  {
    id: "evt-008",
    kind: "kyc",
    summary: "kyc.approved",
    context: '{"store":"Studio Noir","mode":"manual"}',
    occurredAt: hours(15),
  },
  {
    id: "evt-009",
    kind: "dispute",
    summary: "dispute:resolved",
    context: "예약 시간 오기",
    occurredAt: hours(20),
  },
  {
    id: "evt-010",
    kind: "kyc",
    summary: "kyc.manual_review",
    context: '{"store":"BLOOM 명동","reason":"document_quality"}',
    occurredAt: hours(28),
  },
  {
    id: "evt-011",
    kind: "kyc",
    summary: "kyc.approved",
    context: '{"store":"H. Lab 강남","mode":"auto"}',
    occurredAt: hours(36),
  },
  {
    id: "evt-012",
    kind: "dispute",
    summary: "dispute:resolved",
    context: "추가 시술 동의 분쟁",
    occurredAt: hours(44),
  },
];

/* ─── 월별 신규 매장 (최근 12개월, 5월이 최신) ─── */
export const mockMonthlyNewStores: MonthlyNewStoresRow[] = [
  { month: "6월", value: 4 },
  { month: "7월", value: 6 },
  { month: "8월", value: 8 },
  { month: "9월", value: 11 },
  { month: "10월", value: 14 },
  { month: "11월", value: 17 },
  { month: "12월", value: 22 },
  { month: "1월", value: 19 },
  { month: "2월", value: 24 },
  { month: "3월", value: 28 },
  { month: "4월", value: 31 },
  { month: "5월", value: 26 },
];

/* ─── AI cost sparkline (최근 30일, 점진 증가) ─── */
export const mockDailyAiCostSpark: DailyAiCostSparkRow[] = Array.from(
  { length: 30 },
  (_, i) => {
    // 8,000~28,000 KRW 사이 부드러운 곡선
    const base = 9000 + i * 600;
    const wave = Math.round(Math.sin(i / 3) * 1800);
    return { d: i, v: Math.max(6000, base + wave) };
  },
);

/* ─── Dispute SLA donut ─── */
export const mockDisputeSlaResolution: DisputeSlaResolution = {
  withinSla: 11,
  totalResolved: 13,
  pct: 85,
  empty: false,
};

/* ─── 지역별 활성 매장 분포 (17 시도) — KOREA_REGIONS 좌표와 정합 ─── */
export const mockStoreRegionDistribution: StoreRegionDistribution = {
  regions: [
    { code: "11", name: "서울", stores: 58, x: 38, y: 22 },
    { code: "26", name: "부산", stores: 18, x: 66, y: 78 },
    { code: "27", name: "대구", stores: 9, x: 58, y: 60 },
    { code: "28", name: "인천", stores: 8, x: 22, y: 26 },
    { code: "29", name: "광주", stores: 5, x: 34, y: 72 },
    { code: "30", name: "대전", stores: 6, x: 38, y: 54 },
    { code: "31", name: "울산", stores: 4, x: 70, y: 66 },
    { code: "36", name: "세종", stores: 1, x: 38, y: 44 },
    { code: "41", name: "경기", stores: 21, x: 46, y: 30 },
    { code: "42", name: "강원", stores: 3, x: 68, y: 22 },
    { code: "43", name: "충북", stores: 2, x: 50, y: 42 },
    { code: "44", name: "충남", stores: 3, x: 24, y: 44 },
    { code: "45", name: "전북", stores: 1, x: 26, y: 60 },
    { code: "46", name: "전남", stores: 1, x: 24, y: 74 },
    { code: "47", name: "경북", stores: 1, x: 62, y: 46 },
    { code: "48", name: "경남", stores: 1, x: 50, y: 72 },
    { code: "50", name: "제주", stores: 0, x: 28, y: 88 },
  ],
  unknown: 0,
  empty: false,
};

/* ─── Top 카테고리 (GMV 30일) ─── */
export const mockTopCategoriesByGmv: TopCategoryRow[] = [
  { name: "헤어 / 미용", gmvKrw: 14_280_000, shareRatio: 1 },
  { name: "두피 / 클리닉", gmvKrw: 7_640_000, shareRatio: 0.535 },
  { name: "네일 / 케어", gmvKrw: 5_120_000, shareRatio: 0.359 },
  { name: "메이크업", gmvKrw: 3_460_000, shareRatio: 0.242 },
  { name: "에스테틱", gmvKrw: 2_180_000, shareRatio: 0.153 },
];

/* ─── 8개 묶음 (page.tsx 호출 site 1줄 swap용) ─── */
export const mockAdminDashboard = {
  alerts: mockAdminAlertCounts,
  kpi: mockAdminKpiSummary,
  audit: mockAdminAuditTrail,
  monthlyBars: mockMonthlyNewStores,
  costSpark: mockDailyAiCostSpark,
  slaResolution: mockDisputeSlaResolution,
  regionDist: mockStoreRegionDistribution,
  topCategories: mockTopCategoriesByGmv,
} as const;
