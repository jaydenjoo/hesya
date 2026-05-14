/**
 * Sprint 2C PR-A4 — Owner Services AI proposals rich mock fixture.
 *
 * env.MOCK_FIXTURES=true 일 때 /store/services 페이지에 노출되는
 * AI 서비스 추가 제안 카드 5건. inbox + analytics 트래픽 데이터에서
 * AI가 추출했다고 가정.
 */

export interface ServiceAiProposal {
  readonly id: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly category: string;
  readonly suggestedPriceKrw: number;
  readonly suggestedDurationMin: number;
  readonly evidence: ReadonlyArray<string>;
  readonly demandScore: number; // 0-100, 높을수록 수요 강함
  readonly competitorAvgKrw: number;
  readonly projectedMonthlyBookings: number;
  readonly icon: string;
  readonly badge: "trending" | "gap" | "vip";
}

export const mockServiceProposals: ReadonlyArray<ServiceAiProposal> = [
  {
    id: "prop-001",
    nameKo: "외국인 손님 전용 시니어 컷",
    nameEn: "Senior cut for foreign customers",
    category: "헤어",
    suggestedPriceKrw: 65_000,
    suggestedDurationMin: 60,
    evidence: [
      "지난 30일 inbox 'short hair' 요청 28건",
      "이 중 18건이 영어 / 일본어 손님",
      "현재 매장에 60분 단가 5만원 이하 컷 메뉴 없음",
    ],
    demandScore: 87,
    competitorAvgKrw: 58_000,
    projectedMonthlyBookings: 24,
    icon: "✂",
    badge: "gap",
  },
  {
    id: "prop-002",
    nameKo: "J-스타일 디지털펌",
    nameEn: "J-style digital perm",
    category: "헤어 / 펌",
    suggestedPriceKrw: 180_000,
    suggestedDurationMin: 180,
    evidence: [
      "Instagram DM 'natural perm' 키워드 12건",
      "일본 손님 매출 +47% (지난 분기)",
      "근처 동종 매장 8곳 중 6곳이 운영",
    ],
    demandScore: 78,
    competitorAvgKrw: 165_000,
    projectedMonthlyBookings: 15,
    icon: "〰",
    badge: "trending",
  },
  {
    id: "prop-003",
    nameKo: "VIP 트리트먼트 패키지 (90분)",
    nameEn: "VIP treatment package (90min)",
    category: "케어",
    suggestedPriceKrw: 220_000,
    suggestedDurationMin: 90,
    evidence: [
      "VIP 고객 31% 'treatment only' 재방문",
      "현재 트리트먼트 단가 12만원 (35분, low margin)",
      "프리미엄 케어 라인 부재",
    ],
    demandScore: 71,
    competitorAvgKrw: 235_000,
    projectedMonthlyBookings: 12,
    icon: "✦",
    badge: "vip",
  },
  {
    id: "prop-004",
    nameKo: "K-드라마 헤어 패키지 (분석 + 컷 + 매직)",
    nameEn: "K-drama hair package (audit + cut + perm)",
    category: "헤어 / 패키지",
    suggestedPriceKrw: 320_000,
    suggestedDurationMin: 240,
    evidence: [
      "AI 사진 분석 'K-drama style' 매칭 41건",
      "8/10 손님이 컷 + 매직 동시 예약",
      "패키지 할인 적용 시 객단가 +28%",
    ],
    demandScore: 65,
    competitorAvgKrw: 350_000,
    projectedMonthlyBookings: 9,
    icon: "✿",
    badge: "trending",
  },
  {
    id: "prop-005",
    nameKo: "당일 결혼식 업스타일 (1시간)",
    nameEn: "Same-day bridal updo (1h)",
    category: "스타일링",
    suggestedPriceKrw: 95_000,
    suggestedDurationMin: 60,
    evidence: [
      "10/11월 'bridal urgent' 키워드 19건",
      "주말 토 14시 슬롯 부족 (-23%)",
      "당일 예약 전환률 71% (vs 일반 18%)",
    ],
    demandScore: 58,
    competitorAvgKrw: 102_000,
    projectedMonthlyBookings: 7,
    icon: "♢",
    badge: "gap",
  },
];

export const mockServiceProposalStats = {
  totalEvidence: 142,
  scanWindowDays: 30,
  lastScanAt: "2026-05-14T06:00:00Z",
  newProposals: 5,
};
