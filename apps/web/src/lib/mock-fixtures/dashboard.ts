/**
 * O1 Store Dashboard — rich mock fixtures (세션 46).
 *
 * Reference: `docs/design/reference/dashboard-app.jsx` Tile* 컴포넌트 mock 값.
 * 이전 page.tsx에 inline hardcoded 됐던 mock 값을 fixture로 추출 — 외부 시연
 * baseline (MOCK_FIXTURES=true) + 베타 매장 매칭 후 실 DAL 자연 swap.
 *
 * 다국어 (NationalityTile.label 등)는 별도 PR — 일단 reference와 동일 한국어
 * label 유지.
 */

export interface MockDashboardBookings {
  readonly count: number;
  readonly avatars: ReadonlyArray<{
    readonly flag: string;
    readonly bgClass: string;
  }>;
  readonly extraCount: number;
  readonly nextLabel: string;
  /** 12 hour spark (00~12 또는 12~24 등 — 표시는 reference와 동일 12등분). */
  readonly sparkHours: ReadonlyArray<number>;
  /** "지금" axis 위치 — null이면 표시 안 함. */
  readonly nowBarIndex: number;
}

export const mockDashboardBookings: MockDashboardBookings = {
  count: 7,
  avatars: [
    { flag: "🇯🇵", bgClass: "bg-hesya-peach-200" },
    { flag: "🇨🇳", bgClass: "bg-hesya-peach-100" },
    { flag: "🇺🇸", bgClass: "bg-hesya-peach-50" },
  ],
  extraCount: 4,
  nextLabel: "14:00 사쿠라님",
  sparkHours: [1, 2, 0, 3, 1, 0, 2, 1, 1, 0, 2, 0],
  nowBarIndex: 5,
};

export interface MockDashboardWeeklyGmv {
  readonly amountKrw: number;
  readonly deltaPct: number;
  /** 7일 막대 높이 (0~100). */
  readonly weekHeights: ReadonlyArray<number>;
}

export const mockDashboardWeeklyGmv: MockDashboardWeeklyGmv = {
  amountKrw: 4_280_000,
  deltaPct: 24,
  weekHeights: [40, 55, 48, 70, 62, 85, 92],
};

export interface MockDashboardNationalitySegment {
  readonly flag: string;
  readonly label: string;
  readonly pct: number;
  readonly color: string;
}

export interface MockDashboardNationality {
  readonly totalCount: number;
  readonly segments: ReadonlyArray<MockDashboardNationalitySegment>;
}

export const mockDashboardNationality: MockDashboardNationality = {
  totalCount: 47,
  segments: [
    { flag: "🇯🇵", label: "일본", pct: 35, color: "#D88B5B" },
    { flag: "🇨🇳", label: "중국 (간체)", pct: 25, color: "#E8A97A" },
    { flag: "🇨🇳", label: "중국 (번체)", pct: 18, color: "#F5DDC8" },
    { flag: "🇺🇸", label: "미국", pct: 14, color: "#1A2238" },
    { flag: "🇻🇳", label: "베트남", pct: 8, color: "#E8C4D6" },
  ],
};

export interface MockDashboardAiAccuracy {
  readonly pct: number;
  readonly processedCount: number;
}

export const mockDashboardAiAccuracy: MockDashboardAiAccuracy = {
  pct: 94,
  processedCount: 142,
};

export interface MockDashboardKVerified {
  readonly tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  readonly renewalDate: string;
}

export const mockDashboardKVerified: MockDashboardKVerified = {
  tier: "Gold",
  renewalDate: "2026-07-15",
};

export interface MockDashboardGreeting {
  readonly todayBookings: number;
  readonly newReviews: number;
}

/**
 * Greeting subtitle에 들어가는 숫자 (오늘 외국인 예약 / 새 후기).
 *
 * 실 데이터 prerequisite:
 * - todayBookings: bookings 테이블 today 필터 DAL (현재 미연결)
 * - newReviews: reviews 테이블 (ζ phase 도입 전)
 */
export const mockDashboardGreeting: MockDashboardGreeting = {
  todayBookings: 7,
  newReviews: 3,
};

/**
 * 위젯 fallback empty 상태 — `MOCK_FIXTURES=false` 시 사용.
 *
 * prod 베타 매장 매칭 후 실 DAL wire 도입 시 swap.
 */
export const emptyDashboardBookings: MockDashboardBookings = {
  count: 0,
  avatars: [],
  extraCount: 0,
  nextLabel: "",
  sparkHours: Array(12).fill(0),
  nowBarIndex: 0,
};

export const emptyDashboardWeeklyGmv: MockDashboardWeeklyGmv = {
  amountKrw: 0,
  deltaPct: 0,
  weekHeights: Array(7).fill(0),
};

export const emptyDashboardNationality: MockDashboardNationality = {
  totalCount: 0,
  segments: [],
};

export const emptyDashboardAiAccuracy: MockDashboardAiAccuracy = {
  pct: 0,
  processedCount: 0,
};

export const emptyDashboardGreeting: MockDashboardGreeting = {
  todayBookings: 0,
  newReviews: 0,
};
