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
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const db = createDbClient(env.DATABASE_URL);
  const store = await getStorePublicById(db, id);
  if (!store) {
    notFound();
  }

  const [services, staffList] = await Promise.all([
    listServicesByStore(db, store.id),
    listStaffByStore(db, store.id),
  ]);

  const t = await getTranslations({ locale, namespace: "StoreDetail" });
  const address = formatAddress(store.address, store.region);

  const photos = staffList
    .flatMap((s) => s.portfolioUrls ?? [])
    .filter((u): u is string => !!u && u.length > 0)
    .slice(0, 5);

  const languageSet = new Set<string>();
  for (const s of staffList)
    for (const l of s.languages ?? []) languageSet.add(l);

  const hoursValue = summarizeHours(store.businessHours, "10:00–20:00");

  return (
    <CustomerFrame>
      <StickyMiniHeader
        storeName={store.name}
        bookHref={`/c/store/${store.id}/book/schedule`}
        bookLabel={t("bookCta")}
      />

      <HeroGallery photos={photos} placeholderLabel={t("heroPlaceholderAlt")} />

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

        <div className="space-y-7 px-5 pt-6 pb-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold italic tracking-tight text-hesya-navy-900">
                {t("servicesHeading")}
              </h2>
              <Link
                href={`/c/store/${store.id}/photos`}
                className="text-[12px] font-medium text-hesya-amber-600 hover:underline"
              >
                {t("viewPhotos")} →
              </Link>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-hesya-navy-900/55">—</p>
            ) : (
              <ul className="divide-y divide-hesya-peach-100 rounded-2xl border border-hesya-peach-200 bg-white">
                {services.slice(0, 6).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-hesya-navy-900">
                        {pickServiceName(s, locale)}
                      </p>
                      {s.durationMinutes && (
                        <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
                          {t("durationMinutes", { minutes: s.durationMinutes })}
                        </p>
                      )}
                    </div>
                    <p className="flex-shrink-0 text-[13px] font-semibold text-hesya-amber-600">
                      {formatPriceForLocale(s.priceKrw, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-[18px] font-semibold italic tracking-tight text-hesya-navy-900">
              {t("staffHeading")}
            </h2>
            {staffList.length === 0 ? (
              <p className="text-sm text-hesya-navy-900/55">—</p>
            ) : (
              <ul className="space-y-2">
                {staffList.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center gap-3 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3"
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-hesya-peach-100 font-heading text-[14px] font-semibold italic text-hesya-navy-900">
                      {person.name[0]?.toUpperCase() ?? "·"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-hesya-navy-900">
                        {person.name}
                      </p>
                      {person.languages && person.languages.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {person.languages.slice(0, 4).map((lang) => (
                            <span
                              key={lang}
                              className="rounded-full bg-hesya-peach-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-hesya-navy-900/65"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
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
