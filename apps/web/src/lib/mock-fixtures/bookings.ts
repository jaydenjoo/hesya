/**
 * Sprint 2C PR-C1 — Owner Bookings calendar view mock fixtures.
 *
 * Reference: `docs/design/reference/bookings-views.jsx` SEED_BOOKINGS.
 * 7일 × 14시간 calendar grid + 다국적 손님 예약 + 4명 디자이너 컬러 매핑.
 *
 * 베타 매장 매칭 후 실 booking DAL로 fallback. mock은 calendar view의
 * "완성된 운영 도구" 시연을 위한 데이터.
 */

export interface MockStylist {
  readonly id: string;
  readonly name: string;
  readonly short: string;
  /** CSS color value — Tailwind 토큰 대신 hex/var(). */
  readonly color: string;
}

export interface MockBookingCard {
  readonly id: number;
  /** 0=Mon, ..., 6=Sun. */
  readonly day: number;
  /** 시작 시각 (decimal: 13.5 = 13:30). */
  readonly start: number;
  readonly end: number;
  readonly customer: string;
  readonly kr: string;
  readonly flag: string;
  readonly foreign: boolean;
  readonly service: string;
  readonly stylistId: string;
  readonly status: "confirmed" | "pending" | "completed" | "noshow";
  readonly paid: number;
  readonly vip?: boolean;
  readonly current?: boolean;
}

export const mockStylists: ReadonlyArray<MockStylist> = [
  {
    id: "minji",
    name: "김민지",
    short: "민지",
    color: "var(--hesya-amber-500, #E8A97A)",
  },
  { id: "soyeon", name: "이소연", short: "소연", color: "#C68B5C" },
  {
    id: "hyunjoo",
    name: "박현주",
    short: "현주",
    color: "var(--hesya-navy-900, #1A2238)",
  },
  { id: "yujin", name: "최유진", short: "유진", color: "#A47AB0" },
];

export const mockStylistById = (id: string): MockStylist =>
  mockStylists.find((s) => s.id === id) ?? mockStylists[0]!;

export const mockWeekDays: ReadonlyArray<{
  readonly kr: string;
  readonly en: string;
  readonly num: number;
  readonly today?: boolean;
}> = [
  { kr: "월", en: "MON", num: 14 },
  { kr: "화", en: "TUE", num: 15 },
  { kr: "수", en: "WED", num: 16, today: true },
  { kr: "목", en: "THU", num: 17 },
  { kr: "금", en: "FRI", num: 18 },
  { kr: "토", en: "SAT", num: 19 },
  { kr: "일", en: "SUN", num: 20 },
];

/** Grid 시간 범위 09:00–22:00 (14시간). */
export const mockHours: ReadonlyArray<number> = Array.from(
  { length: 14 },
  (_, i) => 9 + i,
);

/** 주간 24 예약 — 다국적 손님 + 다양한 시술 + 4 디자이너. */
export const mockBookings: ReadonlyArray<MockBookingCard> = [
  // Monday
  {
    id: 1,
    day: 0,
    start: 10,
    end: 11.5,
    customer: "Sato Sakura",
    kr: "사쿠라",
    flag: "🇯🇵",
    foreign: true,
    service: "K-Beauty 메이크업",
    stylistId: "minji",
    status: "confirmed",
    paid: 280000,
  },
  {
    id: 2,
    day: 0,
    start: 13,
    end: 14,
    customer: "김지영",
    kr: "김지영",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 45000,
  },
  {
    id: 3,
    day: 0,
    start: 15,
    end: 17,
    customer: "Wei Chen",
    kr: "웨이 첸",
    flag: "🇨🇳",
    foreign: true,
    service: "퍼스널컬러 + 메이크업",
    stylistId: "minji",
    status: "pending",
    paid: 150000,
    vip: true,
  },
  // Tuesday
  {
    id: 4,
    day: 1,
    start: 9.5,
    end: 11,
    customer: "Emma Park",
    kr: "엠마 박",
    flag: "🇺🇸",
    foreign: true,
    service: "헤어 컬러",
    stylistId: "hyunjoo",
    status: "confirmed",
    paid: 220000,
  },
  {
    id: 5,
    day: 1,
    start: 11.5,
    end: 12.5,
    customer: "박서윤",
    kr: "박서윤",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylistId: "soyeon",
    status: "completed",
    paid: 45000,
  },
  {
    id: 6,
    day: 1,
    start: 14,
    end: 16,
    customer: "Tran Linh",
    kr: "린",
    flag: "🇻🇳",
    foreign: true,
    service: "글래스 스킨 페이셜",
    stylistId: "yujin",
    status: "confirmed",
    paid: 180000,
  },
  {
    id: 7,
    day: 1,
    start: 17,
    end: 18.5,
    customer: "Hashimoto Aoi",
    kr: "아오이",
    flag: "🇯🇵",
    foreign: true,
    service: "한국식 레이어드 컷",
    stylistId: "minji",
    status: "confirmed",
    paid: 95000,
  },
  // Wednesday (today)
  {
    id: 8,
    day: 2,
    start: 10,
    end: 12,
    customer: "Liu Mei",
    kr: "메이",
    flag: "🇨🇳",
    foreign: true,
    service: "발레아쥬 컬러",
    stylistId: "hyunjoo",
    status: "confirmed",
    paid: 320000,
    vip: true,
  },
  {
    id: 9,
    day: 2,
    start: 13,
    end: 14.5,
    customer: "Yamada Yuki",
    kr: "유키",
    flag: "🇯🇵",
    foreign: true,
    service: "한국식 펌",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 180000,
    current: true,
  },
  {
    id: 10,
    day: 2,
    start: 15.5,
    end: 17,
    customer: "최예진",
    kr: "최예진",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어 트리트먼트",
    stylistId: "yujin",
    status: "confirmed",
    paid: 90000,
  },
  {
    id: 11,
    day: 2,
    start: 17.5,
    end: 19,
    customer: "Sophia Tran",
    kr: "소피아",
    flag: "🇻🇳",
    foreign: true,
    service: "퍼스널컬러 진단",
    stylistId: "minji",
    status: "pending",
    paid: 120000,
  },
  {
    id: 12,
    day: 2,
    start: 20,
    end: 21.5,
    customer: "Wang Xiao",
    kr: "왕샤오",
    flag: "🇨🇳",
    foreign: true,
    service: "메이크업 + 헤어 세팅",
    stylistId: "minji",
    status: "confirmed",
    paid: 250000,
  },
  // Thursday
  {
    id: 13,
    day: 3,
    start: 10,
    end: 11.5,
    customer: "Park Jiyu",
    kr: "박지유",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷 + 염색",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 150000,
  },
  {
    id: 14,
    day: 3,
    start: 12,
    end: 14,
    customer: "Nguyen Hoa",
    kr: "호아",
    flag: "🇻🇳",
    foreign: true,
    service: "퍼스널컬러 + 헤어 컬러",
    stylistId: "yujin",
    status: "confirmed",
    paid: 280000,
  },
  {
    id: 15,
    day: 3,
    start: 14.5,
    end: 15.5,
    customer: "Liu Han",
    kr: "리우한",
    flag: "🇨🇳",
    foreign: true,
    service: "헤어컷",
    stylistId: "hyunjoo",
    status: "noshow",
    paid: 45000,
  },
  {
    id: 16,
    day: 3,
    start: 16,
    end: 17.5,
    customer: "Yuki Hashimoto",
    kr: "유키 H",
    flag: "🇯🇵",
    foreign: true,
    service: "글래스 스킨 + 메이크업",
    stylistId: "minji",
    status: "confirmed",
    paid: 200000,
  },
  // Friday
  {
    id: 17,
    day: 4,
    start: 9.5,
    end: 11,
    customer: "Sarah Kim",
    kr: "사라 김",
    flag: "🇺🇸",
    foreign: true,
    service: "한국식 펌",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 180000,
  },
  {
    id: 18,
    day: 4,
    start: 11.5,
    end: 13.5,
    customer: "Chen Wei",
    kr: "첸 웨이",
    flag: "🇨🇳",
    foreign: true,
    service: "발레아쥬 + 트리트먼트",
    stylistId: "hyunjoo",
    status: "confirmed",
    paid: 380000,
    vip: true,
  },
  {
    id: 19,
    day: 4,
    start: 14,
    end: 15,
    customer: "이수진",
    kr: "이수진",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 45000,
  },
  {
    id: 20,
    day: 4,
    start: 16,
    end: 18,
    customer: "Mai Phuong",
    kr: "마이 푸엉",
    flag: "🇻🇳",
    foreign: true,
    service: "헤어 컬러 + 메이크업",
    stylistId: "minji",
    status: "pending",
    paid: 250000,
  },
  // Saturday
  {
    id: 21,
    day: 5,
    start: 10,
    end: 12,
    customer: "Aiko Tanaka",
    kr: "아이코",
    flag: "🇯🇵",
    foreign: true,
    service: "K-드라마 룩 토탈",
    stylistId: "minji",
    status: "confirmed",
    paid: 350000,
    vip: true,
  },
  {
    id: 22,
    day: 5,
    start: 13,
    end: 14.5,
    customer: "정수민",
    kr: "정수민",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷 + 펌",
    stylistId: "soyeon",
    status: "confirmed",
    paid: 200000,
  },
  {
    id: 23,
    day: 5,
    start: 15,
    end: 17,
    customer: "Helen Tran",
    kr: "헬렌",
    flag: "🇺🇸",
    foreign: true,
    service: "퍼스널컬러 + 컬러",
    stylistId: "yujin",
    status: "confirmed",
    paid: 280000,
  },
  // Sunday
  {
    id: 24,
    day: 6,
    start: 12,
    end: 14,
    customer: "Wei Zhang",
    kr: "웨이 장",
    flag: "🇨🇳",
    foreign: true,
    service: "헤어 토탈 케어",
    stylistId: "hyunjoo",
    status: "confirmed",
    paid: 320000,
  },
];

export const mockWeekLabel = "2026.04.14 — 04.20";

/** Counts for filter pills. */
export const mockBookingCounts = {
  all: mockBookings.length,
  foreign: mockBookings.filter((b) => b.foreign).length,
  confirmed: mockBookings.filter((b) => b.status === "confirmed").length,
  pending: mockBookings.filter((b) => b.status === "pending").length,
  noshow: mockBookings.filter((b) => b.status === "noshow").length,
} as const;
