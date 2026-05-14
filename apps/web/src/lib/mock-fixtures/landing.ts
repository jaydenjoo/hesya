/**
 * Sprint 2A PR-A1 — Customer Landing rich mock fixtures.
 *
 * Reference: `docs/design/reference/landing-app.jsx` (UGC wall, trending, reviews, safety strip).
 * 외부 시연 시 풍부한 데이터로 "완성 제품" 임팩트 제공. baseline은 다국어 시나리오.
 *
 * 베타 매장 매칭 후 `MOCK_FIXTURES=false`로 끄면 자동 빈 배열 또는 실 DAL fallback.
 */

export interface MockUGCCard {
  readonly id: string;
  readonly flag: string;
  readonly name: string;
  readonly source: "instagram" | "xiaohongshu";
  readonly stars: number;
  readonly quote: string;
  readonly imageUrl: string;
}

export interface MockTrendingSearch {
  readonly rank: number;
  readonly text: string;
}

export interface MockReview {
  readonly id: string;
  readonly flag: string;
  readonly stars: number;
  /** 원문 언어 그대로 — 일본/중국/베트남/미국 등 다국적 후기. */
  readonly quote: string;
  /** 영어로 자동 번역된 텍스트 (auto-translate label과 함께 표시). */
  readonly translation: string;
}

/**
 * UGC wall — Instagram + 샤오홍슈에서 가져온 외국인 여행객 시술 후기.
 * 사진은 Unsplash CDN (K-beauty / salon / hair styling 테마).
 */
export const mockUGCCards: ReadonlyArray<MockUGCCard> = [
  {
    id: "ugc-1",
    flag: "🇯🇵",
    name: "Sakura",
    source: "instagram",
    stars: 5,
    quote: "송혜교 같은 단발 가능했어!",
    imageUrl:
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80",
  },
  {
    id: "ugc-2",
    flag: "🇨🇳",
    name: "Mei",
    source: "xiaohongshu",
    stars: 5,
    quote: "膚色对比超惊艳",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
  },
  {
    id: "ugc-3",
    flag: "🇺🇸",
    name: "Emma",
    source: "instagram",
    stars: 5,
    quote: "Best layered cut of my life",
    imageUrl:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80",
  },
  {
    id: "ugc-4",
    flag: "🇹🇼",
    name: "Yi-Ling",
    source: "instagram",
    stars: 4,
    quote: "디자이너 영어 가능해서 안심",
    imageUrl:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80",
  },
  {
    id: "ugc-5",
    flag: "🇻🇳",
    name: "Linh",
    source: "xiaohongshu",
    stars: 5,
    quote: "글래스 스킨 처음 받아봤어요",
    imageUrl:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80",
  },
  {
    id: "ugc-6",
    flag: "🇯🇵",
    name: "Aoi",
    source: "instagram",
    stars: 5,
    quote: "パーソナルカラー診断◎",
    imageUrl:
      "https://images.unsplash.com/photo-1633681926022-84852f7b8b4f?w=400&q=80",
  },
];

/**
 * 이번 주 외국인 검색 TOP 6 — chip 클릭 시 search input에 자동 채움 + navigate.
 */
export const mockTrendingSearches: ReadonlyArray<MockTrendingSearch> = [
  { rank: 1, text: "K-drama short layered cut" },
  { rank: 2, text: "Glass-skin makeup trial" },
  { rank: 3, text: "Pink-blonde balayage" },
  { rank: 4, text: "Personal color consultation" },
  { rank: 5, text: "Aegyo sal makeup" },
  { rank: 6, text: "Korean perm" },
];

/**
 * 다국어 후기 — 원문 + 영어 번역 둘 다 표시 (자동 번역 시그널).
 */
export const mockReviews: ReadonlyArray<MockReview> = [
  {
    id: "rv-1",
    flag: "🇯🇵",
    stars: 5,
    quote: "송혜교 같은 단발 가능했어요!",
    translation: "Got the same short cut as Song Hye-kyo!",
  },
  {
    id: "rv-2",
    flag: "🇨🇳",
    stars: 5,
    quote: "膚色对比超惊艳，我变好看了。",
    translation: "The color contrast was stunning. I look great.",
  },
  {
    id: "rv-3",
    flag: "🇻🇳",
    stars: 5,
    quote: "Glass skin lần đầu, mê quá!",
    translation: "First time with glass skin makeup — obsessed.",
  },
];

/**
 * Solo female traveler safety stats — 4개 정보 + 출처.
 * 숫자는 i18n template placeholder ({percent}, {min}) 적용 가능.
 */
export const mockSafetyStats = {
  femalePercent: 92,
  subwayMinutes: 5,
} as const;
