/**
 * Sprint 2A PR-A3 — Customer MyPage rich mock fixtures.
 *
 * Reference: `docs/design/reference/mypage-app.jsx`.
 * Sakura 페르소나 — 일본인 도쿄 거주, 한국 여행 중 4박 5일.
 *
 * 베타 매장 매칭 전까지 외부 데모에서 "완성된 멤버 경험" 시연 데이터.
 * 매장 매칭 후 customerId 별 실 DAL fallback (page.tsx에서 empty array 시 자동 swap).
 */

import type {
  CustomerBookingRow,
  PendingReviewRow,
  SavedStoreRow,
} from "@/shared/lib/dal/customer-mypage";

/** 외국인 손님 프로필 — header 영역에 표시. */
export const mockCustomerProfile = {
  displayName: "Sakura",
  flag: "🇯🇵",
  locale: "ja-JP",
  hometown: "Tokyo",
  tripLabel: "Trip 4 · Apr 14–18, 2026",
} as const;

/**
 * Mini timeline — 5일 가로 슬라이드 (어제·오늘·내일·모레·...).
 * "booked" 표시는 단 1건의 upcoming 예약이 있는 날.
 */
export const mockMiniTimeline: ReadonlyArray<{
  readonly day: string;
  readonly month: string;
  readonly today?: boolean;
  readonly booked?: boolean;
}> = [
  { day: "14", month: "Apr" },
  { day: "15", month: "Apr", today: true },
  { day: "16", month: "Apr", booked: true },
  { day: "17", month: "Apr" },
  { day: "18", month: "Apr" },
];

/** 내일 14:00 — Stylista Hongdae. */
export const mockUpcomingBookings: ReadonlyArray<CustomerBookingRow> = [
  {
    id: "bk-up-1",
    storeId: "store-mock-stylista",
    storeName: "Stylista — Hongdae",
    serviceName: "Korean Layered Cut + Treatment",
    staffName: "Minji Kim 박민지",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: "scheduled",
    totalPriceKrw: 150000,
  },
];

/** 과거 예약 4건 — 다양한 매장·시술·평점. */
export const mockPastBookings: ReadonlyArray<CustomerBookingRow> = [
  {
    id: "bk-past-1",
    storeId: "store-mock-stylista",
    storeName: "Stylista — Hongdae",
    serviceName: "Korean Layered Cut",
    staffName: "Minji Kim",
    scheduledAt: new Date("2026-03-12T14:00:00+09:00"),
    status: "completed",
    totalPriceKrw: 85000,
  },
  {
    id: "bk-past-2",
    storeId: "store-mock-glow-lab",
    storeName: "Glow Lab — Gangnam",
    serviceName: "Korean Glow Makeup",
    staffName: "Soyoung Park",
    scheduledAt: new Date("2026-03-14T11:00:00+09:00"),
    status: "completed",
    totalPriceKrw: 120000,
  },
  {
    id: "bk-past-3",
    storeId: "store-mock-mool",
    storeName: "Mool Nails — Seongsu",
    serviceName: "Gel Nail Art",
    staffName: "Hyejin Lee",
    scheduledAt: new Date("2025-09-22T15:00:00+09:00"),
    status: "completed",
    totalPriceKrw: 68000,
  },
  {
    id: "bk-past-4",
    storeId: "store-mock-hue",
    storeName: "Hue Studio — Itaewon",
    serviceName: "Personal Color Diagnosis",
    staffName: "Jaewon Choi",
    scheduledAt: new Date("2025-09-24T16:00:00+09:00"),
    status: "completed",
    totalPriceKrw: 95000,
  },
];

/** 저장한 매장 6개. */
export const mockSavedStores: ReadonlyArray<SavedStoreRow> = [
  {
    storeId: "store-mock-stylista",
    storeName: "Stylista — Hongdae",
    savedAt: new Date("2026-03-01T10:00:00+09:00"),
  },
  {
    storeId: "store-mock-soyo",
    storeName: "Soyo Beauty",
    savedAt: new Date("2026-03-05T11:00:00+09:00"),
  },
  {
    storeId: "store-mock-mool",
    storeName: "Mool Nails",
    savedAt: new Date("2026-03-08T12:00:00+09:00"),
  },
  {
    storeId: "store-mock-hue",
    storeName: "Hue Studio",
    savedAt: new Date("2026-03-10T13:00:00+09:00"),
  },
  {
    storeId: "store-mock-petit",
    storeName: "Petit Salon",
    savedAt: new Date("2026-03-12T14:00:00+09:00"),
  },
  {
    storeId: "store-mock-lumiere",
    storeName: "Lumière K",
    savedAt: new Date("2026-03-15T15:00:00+09:00"),
  },
];

/** 후기 작성 대기 2건. */
export const mockPendingReviews: ReadonlyArray<PendingReviewRow> = [
  {
    bookingId: "bk-past-2",
    storeId: "store-mock-glow-lab",
    storeName: "Glow Lab — Gangnam",
    serviceName: "Korean Glow Makeup",
    scheduledAt: new Date("2026-03-14T11:00:00+09:00"),
  },
  {
    bookingId: "bk-past-3",
    storeId: "store-mock-mool",
    storeName: "Mool Nails — Seongsu",
    serviceName: "Gel Nail Art",
    scheduledAt: new Date("2025-09-22T15:00:00+09:00"),
  },
];

/**
 * 멤버십 perk band — 3/5 예약 완료 시 5% off 다음 방문.
 * 실제 결제 5건 누적 시 자동 트리거 (Phase 1.5 비즈니스 로직).
 */
export const mockPerks = {
  completedCount: 3,
  targetCount: 5,
  discountPercent: 5,
} as const;
