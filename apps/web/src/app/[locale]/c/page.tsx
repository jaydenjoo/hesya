/**
 * Plan v3 M4.5 — customer 랜딩 페이지.
 *
 * 외국인 손님 첫 진입점. 매장 검색 + region chip 필터 + store card grid.
 *
 * 축소 scope (베타 핵심):
 *   - 매장 검색 (이름/지역 ilike) + region chip 필터 + 매장 카드 + 매장 진입
 *   - 인증 분기 (로그인 시 mypage button, 미로그인 시 sign-in button)
 *
 * 보류 (Phase 2):
 *   - AI photo upload, UGC wall, trending searches, reviews carousel.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { listPublicStores } from "@/shared/lib/dal/stores";
import { CustomerLanding } from "@/features/customer-landing/customer-landing";
import {
  mockReviews,
  mockSafetyStats,
  mockTrendingSearches,
  mockUGCCards,
} from "@/lib/mock-fixtures/landing";
import "./c-landing.css";

/**
 * 공개 매장 목록 60초 캐시 — region/search 조합별.
 *
 * 외국인 손님 첫 진입 trafficが 많은 매장 카드 grid. 같은 region/search 조합은
 * 60s 동안 DB hit 없음. cold ~3s → warm ~50ms 절감.
 *
 * 무효화: 신규 매장 등록 시 별도 revalidatePath 미적용 (60s 자연 만료로 충분).
 */
const getPublicStoresCached = unstable_cache(
  async (region: string | undefined, search: string | undefined) => {
    const db = createDbClient(env.DATABASE_URL);
    return listPublicStores(db, { region, search, limit: 24 });
  },
  ["public-stores-list-v1"],
  { revalidate: 60, tags: ["stores"] },
);

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ region?: string; q?: string }>;
}

const REGIONS = [
  "Seoul",
  "Busan",
  "Jeju",
  "Gangnam",
  "Hongdae",
  "Myeongdong",
  "Seongsu",
  "Apgujeong",
] as const;

export default async function CustomerLandingPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { region, q } = await searchParams;

  const stores = await getPublicStoresCached(
    region?.trim() || undefined,
    q?.trim() || undefined,
  );

  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const isAuthed = Boolean(session?.user?.email);

  const t = await getTranslations({ locale, namespace: "CustomerLanding" });

  // Sprint 2A: MOCK_FIXTURES=true 시 풍부한 mock 섹션 (UGC/trending/reviews).
  // false면 빈 배열 → 컴포넌트가 섹션 자동 숨김 (실 DAL fallback은 Phase 1.5).
  const useFixtures = env.MOCK_FIXTURES;

  return (
    <CustomerLanding
      locale={locale}
      isAuthed={isAuthed}
      initialRegion={region?.trim() ?? ""}
      initialSearch={q?.trim() ?? ""}
      stores={stores}
      regions={[...REGIONS]}
      mockUGCCards={useFixtures ? mockUGCCards : undefined}
      mockTrending={useFixtures ? mockTrendingSearches : undefined}
      mockReviews={useFixtures ? mockReviews : undefined}
      labels={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        searchPlaceholder: t("searchPlaceholder"),
        // Batch 2: 5 placeholder rotation. JSON에는 array 저장 → t.raw로 꺼냄.
        placeholders: t.raw("placeholders") as string[],
        moodLabel: t("moodLabel"),
        moods: t.raw("moods") as string[],
        regionLabel: t("regionLabel"),
        regionAll: t("regionAll"),
        // next-intl 4.x: ICU `{n}` 변수는 t() 호출 시점에 채워야 함 (manual replace 안 됨).
        resultsCount: t("resultsCount", { n: stores.length }),
        emptyTitle: t("emptyTitle"),
        emptySubtitle: t("emptySubtitle"),
        signIn: t("signIn"),
        mypage: t("mypage"),
        viewStore: t("viewStore"),
        // ICU 미사용 — review count 자체는 client 측 store.reviewCount로 채움.
        // suffix는 "({n})" 같은 wrapper text로 client에서 replace.
        reviewCountSuffix: t("reviewCountSuffix"),
        verifiedBadge: t("verifiedBadge"),
        aiPhotoCta: t("aiPhotoCta"),
        aiPhotoSubtitle: t("aiPhotoSubtitle"),
        // Sprint 2A: 5 신규 reference 섹션 labels.
        liveRow: useFixtures ? t("liveRow") : undefined,
        ugcTitle: useFixtures ? t("ugcTitle") : undefined,
        ugcSubtitle: useFixtures ? t("ugcSubtitle") : undefined,
        ugcShowMore: useFixtures ? t("ugcShowMore") : undefined,
        trendingTitle: useFixtures ? t("trendingTitle") : undefined,
        trendingSubtitle: useFixtures ? t("trendingSubtitle") : undefined,
        reviewsTitle: useFixtures ? t("reviewsTitle") : undefined,
        reviewsSubtitle: useFixtures ? t("reviewsSubtitle") : undefined,
        safetyTitle: useFixtures ? t("safetyTitle") : undefined,
        safetyStat1: useFixtures ? t("safetyStat1") : undefined,
        safetyStat2: useFixtures
          ? t("safetyStat2", { percent: mockSafetyStats.femalePercent })
          : undefined,
        safetyStat3: useFixtures
          ? t("safetyStat3", { min: mockSafetyStats.subwayMinutes })
          : undefined,
        safetyStat4: useFixtures ? t("safetyStat4") : undefined,
        safetySource: useFixtures ? t("safetySource") : undefined,
        countryTitle: t("countryTitle"),
        countrySubtitle: t("countrySubtitle"),
        langSheetTitle: t("langSheetTitle"),
        tabSearch: t("tabSearch"),
        tabBookings: t("tabBookings"),
        tabChat: t("tabChat"),
        tabMypage: t("tabMypage"),
      }}
    />
  );
}
