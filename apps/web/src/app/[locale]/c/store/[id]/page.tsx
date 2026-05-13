import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient, type BusinessHours } from "@hesya/database";

import { formatPriceForLocale } from "@/features/booking-customer/currency";
import { KVerifiedBadge } from "@/features/customer-frame/badges/k-verified-badge";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { BottomActionBar } from "@/features/store-detail-customer/bottom-action-bar";
import { HeroGallery } from "@/features/store-detail-customer/hero-gallery";
import { SafetyProfileStrip } from "@/features/store-detail-customer/safety-profile-strip";
import { StickyMiniHeader } from "@/features/store-detail-customer/sticky-mini-header";
import { TabInfo } from "@/features/store-detail-customer/tab-info";
import { TabPlaceholder } from "@/features/store-detail-customer/tab-placeholder";
import { TabReviews } from "@/features/store-detail-customer/tab-reviews";
import {
  TabServices,
  type ServiceItem,
} from "@/features/store-detail-customer/tab-services";
import {
  TabStylists,
  type StylistItem,
} from "@/features/store-detail-customer/tab-stylists";
import { DetailTabs } from "@/features/store-detail-customer/tabs";
import { env } from "@/shared/config/env";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 데모용 hero fallback image — 베타 5곳 매장이 사진 업로드 전까지 빈 그라데이션 회피.
 * Unsplash 호스팅 (Adam Winger, 여성 손님 + 여성 디자이너 헤어 살롱). 직접 hotlink 안정.
 * 매장 owner가 portfolioUrls 업로드하면 자동으로 그 사진 우선. fallback 로드 실패 시 그라데이션.
 * TODO: 베타 출시 직전 self-host (Vercel Blob / public/)으로 교체 — Unsplash 의존 제거.
 */
const DEMO_HERO_FALLBACK =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=880&h=560&fit=crop&auto=format&q=80";

/**
 * 매장 상세 데이터 (store + services + staff) 60초 캐시.
 *
 * 외부 손님이 매장 카드 클릭 시 매번 3 DAL × ~1초 발생. 캐시로 cold ~3s →
 * warm ~50ms 절감 (1분 안에 같은 매장 재방문 시).
 *
 * 무효화: 매장 owner가 services/staff 수정 시 별도 revalidatePath 호출 필요
 * (현재 미적용 — 60초 후 자연 만료로 충분, owner UI는 자기 매장 직접 조회).
 *
 * 참고: DbClient는 직렬화 불가라 캐시 함수 안에서 새로 생성. 캐시 hit 시엔
 * DB 연결 자체를 안 함.
 */
const getStoreDetailCached = unstable_cache(
  async (storeId: string) => {
    const db = createDbClient(env.DATABASE_URL);
    // Perf 3: 3 쿼리 모두 parallel — services/staff는 storeId만 알면 됨.
    // store 없으면 services/staff 빈 배열 (FK 매칭 0) — 안전.
    // Cache miss 시 max(3 query) ≈ 1 RTT (이전: store 후 Promise.all 2 RTT).
    const [store, services, staffList] = await Promise.all([
      getStorePublicById(db, storeId),
      listServicesByStore(db, storeId),
      listStaffByStore(db, storeId),
    ]);
    if (!store) return null;
    return { store, services, staffList };
  },
  ["store-detail-public-v1"],
  { revalidate: 60, tags: ["stores", "services", "staff"] },
);

type ServiceNameKey =
  | "nameKo"
  | "nameEn"
  | "nameJa"
  | "nameZhCn"
  | "nameZhTw"
  | "nameVi";

function pickServiceName(
  service: { nameKo: string } & Partial<Record<ServiceNameKey, string | null>>,
  locale: string,
): string {
  const map: Record<string, ServiceNameKey> = {
    ko: "nameKo",
    en: "nameEn",
    ja: "nameJa",
    "zh-CN": "nameZhCn",
    "zh-TW": "nameZhTw",
    vi: "nameVi",
  };
  const key = map[locale] ?? "nameKo";
  return service[key] ?? service.nameKo;
}

function formatAddress(address: unknown, region: string | null): string | null {
  if (typeof address === "object" && address && "full" in address) {
    const full = (address as { full?: unknown }).full;
    if (typeof full === "string" && full.trim()) return full;
  }
  return region?.trim() || null;
}

function summarizeHours(hours: BusinessHours | null, fallback: string): string {
  if (!hours) return fallback;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  for (const d of days) {
    const v = hours[d];
    if (v && v.open && v.close) return `${v.open}–${v.close}`;
  }
  return fallback;
}

/**
 * Plan v3 M2.1 / Phase D2-B2-a — customer-side public 매장 상세 (shell 정합).
 *
 * 외부인이 매장 UUID로 접근. `auto_approved` + soft-delete X 매장만 노출.
 *
 * D2-B2-a에서 추가:
 * - CustomerFrame wrap (radial peach grad + 데스크톱 iPhone-frame)
 * - HeroGallery (staff portfolioUrls flatten, 가로 scroll-snap + dots)
 * - SafetyProfileStrip (K-Verified / hours / staff 수 / 언어 수)
 * - StickyMiniHeader (스크롤 통과 시 fade-in)
 * - BottomActionBar (♡ ✉ + Book CTA)
 *
 * 6 탭 시스템(Services/Stylists/Reviews/Info)은 D2-B2-b에서.
 */
export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const data = await getStoreDetailCached(id);
  if (!data) {
    notFound();
  }
  const { store, services, staffList } = data;

  const t = await getTranslations({ locale, namespace: "StoreDetail" });
  const tSettings = await getTranslations({
    locale,
    namespace: "StoreSettings",
  });
  const address = formatAddress(store.address, store.region);

  const photos = staffList
    .flatMap((s) => s.portfolioUrls ?? [])
    .filter((u): u is string => !!u && u.length > 0)
    .slice(0, 5);

  const languageSet = new Set<string>();
  for (const s of staffList)
    for (const l of s.languages ?? []) languageSet.add(l);

  const hoursValue = summarizeHours(store.businessHours, "10:00–20:00");

  const serviceItems: ServiceItem[] = services.map((s) => ({
    id: s.id,
    name: pickServiceName(s, locale),
    priceFormatted: formatPriceForLocale(s.priceKrw, locale),
    durationLabel: s.durationMinutes
      ? t("durationMinutes", { minutes: s.durationMinutes })
      : null,
  }));

  const stylistItems: StylistItem[] = staffList.map((p) => ({
    id: p.id,
    name: p.name,
    languages: p.languages ?? [],
    thumbnailUrl: p.portfolioUrls?.[0] ?? null,
  }));

  return (
    <CustomerFrame>
      <StickyMiniHeader
        storeName={store.name}
        bookHref={`/c/store/${store.id}/book/schedule`}
        bookLabel={t("bookCta")}
      />

      <HeroGallery
        photos={photos}
        placeholderLabel={t("heroPlaceholderAlt")}
        fallbackImageUrl={DEMO_HERO_FALLBACK}
      />

      <div className="flex flex-col">
        <div className="px-5 pt-4">
          <div className="mb-1.5 flex items-center gap-2">
            <KVerifiedBadge label={t("kVerifiedShort")} />
            {store.category && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
                {store.category}
              </span>
            )}
          </div>
          <h1 className="font-heading text-[28px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {store.name}
          </h1>
          {address && (
            <p className="mt-1 text-[12px] text-hesya-navy-900/65">
              <span className="mr-1.5 text-hesya-navy-900/45">
                {t("address")}
              </span>
              {address}
            </p>
          )}
        </div>

        <SafetyProfileStrip
          kVerifiedLabel={t("safetyKVerifiedLabel")}
          verifiedValue={t("safetyKVerifiedValue")}
          hoursLabel={t("safetyHoursLabel")}
          hoursValue={hoursValue}
          staffLabel={t("safetyStaffLabel")}
          staffValue={staffList.length.toString()}
          langLabel={t("safetyLangLabel")}
          langValue={languageSet.size.toString()}
        />

        <DetailTabs
          labels={[
            t("tabServices"),
            t("tabStylists"),
            t("tabReviews"),
            t("tabInfo"),
            t("tabCompare"),
            t("tabLiveUgc"),
          ]}
        >
          <TabServices items={serviceItems} emptyLabel={t("emptyServices")} />
          <TabStylists items={stylistItems} emptyLabel={t("emptyStylists")} />
          <TabReviews
            comingSoonLabel={t("reviewsComingSoon")}
            sampleAuthor1={t("reviewSampleAuthor1")}
            sampleAuthor2={t("reviewSampleAuthor2")}
            sampleAuthor3={t("reviewSampleAuthor3")}
            sampleQuote1={t("reviewSampleQuote1")}
            sampleQuote2={t("reviewSampleQuote2")}
            sampleQuote3={t("reviewSampleQuote3")}
          />
          <TabInfo
            hours={store.businessHours}
            hoursTitle={t("infoHoursTitle")}
            hoursFallback={t("infoHoursFallback")}
            closedLabel={t("infoClosedLabel")}
            addressTitle={t("infoAddressTitle")}
            addressText={address}
            addressFallback={t("infoAddressFallback")}
            verificationTitle={t("infoVerificationTitle")}
            verificationBody={t("infoVerificationBody")}
            kVerifiedShort={t("kVerifiedShort")}
            dayLabels={{
              mon: tSettings("dayMon"),
              tue: tSettings("dayTue"),
              wed: tSettings("dayWed"),
              thu: tSettings("dayThu"),
              fri: tSettings("dayFri"),
              sat: tSettings("daySat"),
              sun: tSettings("daySun"),
            }}
          />
          <TabPlaceholder
            icon="⇋"
            heading={t("compareHeading")}
            body={t("compareBody")}
          />
          <TabPlaceholder
            icon="◐"
            heading={t("liveUgcHeading")}
            body={t("liveUgcBody")}
          />
        </DetailTabs>
      </div>

      <BottomActionBar
        bookHref={`/c/store/${store.id}/book/schedule`}
        bookLabel={t("bookCta")}
        favoriteLabel={t("favoriteLabel")}
        chatLabel={t("chatLabel")}
      />
    </CustomerFrame>
  );
}
