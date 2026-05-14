/**
 * Sprint 2C PR-D2 — Admin KYC operator review queue rich mock.
 *
 * env.MOCK_FIXTURES=true 일 때 store-verifications 페이지에 노출되는
 * 풍부한 큐. 실제 DAL `listStoresPendingReview`는 prod 데이터 0건이므로
 * 시연 시 빈 화면. 운영자 review UX 첫인상을 위해 mock 8건 + 통계 패널.
 */

export interface KycQueueItem {
  readonly id: string;
  readonly storeName: string;
  readonly storeNameRomanized: string;
  readonly category: string;
  readonly ownerName: string;
  readonly nationality: string;
  readonly flag: string;
  readonly riskScore: number; // 0-100, 높을수록 위험
  readonly riskTier: "low" | "medium" | "high";
  readonly submittedAt: string; // ISO
  readonly slaHoursRemaining: number; // 24 SLA 기준
  readonly documents: ReadonlyArray<{
    readonly type: "business" | "license" | "id" | "address";
    readonly label: string;
    readonly status: "ok" | "blurry" | "expired" | "missing";
  }>;
  readonly aiHints: ReadonlyArray<string>;
  readonly priorIncidents: number;
}

export const mockKycQueue: ReadonlyArray<KycQueueItem> = [
  {
    id: "kyc-001",
    storeName: "Stylista 홍대점",
    storeNameRomanized: "Stylista Hongdae",
    category: "헤어 / 미용",
    ownerName: "김민지",
    nationality: "Korea",
    flag: "🇰🇷",
    riskScore: 18,
    riskTier: "low",
    submittedAt: "2026-05-14T08:15:00Z",
    slaHoursRemaining: 21,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "ok" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: ["사업자번호 국세청 매칭 OK", "주소 도로명 일치 OK"],
    priorIncidents: 0,
  },
  {
    id: "kyc-002",
    storeName: "美的空間",
    storeNameRomanized: "Mei De Kong Jian",
    category: "헤어 / 컬러",
    ownerName: "陳偉",
    nationality: "Taiwan",
    flag: "🇹🇼",
    riskScore: 42,
    riskTier: "medium",
    submittedAt: "2026-05-14T03:42:00Z",
    slaHoursRemaining: 14,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "blurry" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: ["면허증 사진 흐림 — 재요청 권장", "외국인 대표 — 추가 신원 확인"],
    priorIncidents: 0,
  },
  {
    id: "kyc-003",
    storeName: "Beauty Haus 강남",
    storeNameRomanized: "Beauty Haus Gangnam",
    category: "헤어 / 펌",
    ownerName: "박지영",
    nationality: "Korea",
    flag: "🇰🇷",
    riskScore: 8,
    riskTier: "low",
    submittedAt: "2026-05-13T22:10:00Z",
    slaHoursRemaining: 6,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "ok" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: ["모든 문서 자동 매칭 통과", "K-Verified 자격 즉시 부여 가능"],
    priorIncidents: 0,
  },
  {
    id: "kyc-004",
    storeName: "쁘띠살롱 명동",
    storeNameRomanized: "Petite Salon Myeongdong",
    category: "메이크업",
    ownerName: "최서연",
    nationality: "Korea",
    flag: "🇰🇷",
    riskScore: 67,
    riskTier: "high",
    submittedAt: "2026-05-13T11:30:00Z",
    slaHoursRemaining: -3,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "expired" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "missing" },
    ],
    aiHints: [
      "면허 만료 (2025-12-31)",
      "임대차계약서 누락",
      "SLA 초과 — 우선 처리 필요",
    ],
    priorIncidents: 1,
  },
  {
    id: "kyc-005",
    storeName: "Tokyo Hair Lab",
    storeNameRomanized: "Tokyo Hair Lab",
    category: "헤어 / 컷",
    ownerName: "山田 美咲",
    nationality: "Japan",
    flag: "🇯🇵",
    riskScore: 35,
    riskTier: "medium",
    submittedAt: "2026-05-13T15:20:00Z",
    slaHoursRemaining: 9,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "ok" },
      { type: "id", label: "대표자 신분증 (외국인등록증)", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: ["외국인 대표 — 비자 정보 확인 권장 (E-7)"],
    priorIncidents: 0,
  },
  {
    id: "kyc-006",
    storeName: "Salon de Lumière",
    storeNameRomanized: "Salon de Lumiere",
    category: "헤어 / 트리트먼트",
    ownerName: "이재현",
    nationality: "Korea",
    flag: "🇰🇷",
    riskScore: 22,
    riskTier: "low",
    submittedAt: "2026-05-14T06:55:00Z",
    slaHoursRemaining: 19,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "ok" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: ["문서 일치 OK", "오너 본인 인증 100%"],
    priorIncidents: 0,
  },
  {
    id: "kyc-007",
    storeName: "Glow Studio 이태원",
    storeNameRomanized: "Glow Studio Itaewon",
    category: "네일 / 케어",
    ownerName: "Park Hannah",
    nationality: "USA → Korea",
    flag: "🇺🇸",
    riskScore: 51,
    riskTier: "medium",
    submittedAt: "2026-05-12T18:00:00Z",
    slaHoursRemaining: -16,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "공중위생업 신고증", status: "ok" },
      { type: "id", label: "대표자 신분증 (영주권)", status: "ok" },
      { type: "address", label: "임대차계약서", status: "blurry" },
    ],
    aiHints: [
      "외국인 대표 (F-5 영주권) — 정상",
      "임대차 사진 흐림 — 재요청 검토",
      "SLA 초과",
    ],
    priorIncidents: 0,
  },
  {
    id: "kyc-008",
    storeName: "Hera Beauty 신촌",
    storeNameRomanized: "Hera Beauty Sinchon",
    category: "헤어 / 컬러",
    ownerName: "정유나",
    nationality: "Korea",
    flag: "🇰🇷",
    riskScore: 89,
    riskTier: "high",
    submittedAt: "2026-05-11T09:00:00Z",
    slaHoursRemaining: -49,
    documents: [
      { type: "business", label: "사업자등록증", status: "ok" },
      { type: "license", label: "미용업 면허", status: "ok" },
      { type: "id", label: "대표자 신분증", status: "ok" },
      { type: "address", label: "임대차계약서", status: "ok" },
    ],
    aiHints: [
      "과거 분쟁 1건 (2025-11, 환불 거부)",
      "사업자번호 다른 매장과 중복 신호",
      "수기 검토 강력 권장",
    ],
    priorIncidents: 1,
  },
];

export const mockKycQueueStats = {
  pending: 8,
  slaBreached: 3,
  avgRiskScore: 42,
  todayApproved: 12,
  todayRejected: 2,
  weekAutoApprovedPct: 64,
};
