import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { formatPriceForLocale } from "@/features/booking-customer/currency";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

// PostgreSQL invalid-UUID-syntax 에러 방지. id가 형식 어긋나면 notFound로 위장.
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

/**
 * Plan v3 M2.1 — customer-side public 매장 상세.
 *
 * 외부인이 매장 UUID로 접근. `auto_approved` + soft-delete X 매장만 노출.
 * 비공개·미존재 매장은 모두 notFound (정보 노출 차단). 인증 불필요.
 *
 * "예약 진행" CTA는 M2.3 schedule 페이지가 도착할 때까지 비활성. 본 페이지는
 * 외부 손님 첫 진입 surface (외부 데모 가이드의 5번째 단계).
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          {t("eyebrow")}
        </p>
        <h1
          className="text-4xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          {store.name}
        </h1>
        {address && (
          <p className="text-sm text-hesya-navy-900/70">
            <span className="mr-2 text-hesya-navy-900/50">{t("address")}</span>
            {address}
          </p>
        )}
        <Link
          href={`/c/store/${store.id}/photos`}
          className="inline-block text-sm text-hesya-amber-600 hover:underline"
        >
          {t("viewPhotos")}
        </Link>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-hesya-navy-900">
          {t("servicesHeading")}
        </h2>
        {services.length === 0 ? (
          <p className="text-sm text-hesya-navy-900/55">—</p>
        ) : (
          <ul className="divide-y divide-hesya-peach-100 rounded-2xl border border-hesya-peach-100 bg-white">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-base font-medium text-hesya-navy-900">
                    {pickServiceName(s, locale)}
                  </p>
                  {s.durationMinutes && (
                    <p className="mt-0.5 text-xs text-hesya-navy-900/55">
                      {t("durationMinutes", { minutes: s.durationMinutes })}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold text-hesya-amber-600">
                  {formatPriceForLocale(s.priceKrw, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-hesya-navy-900">
          {t("staffHeading")}
        </h2>
        {staffList.length === 0 ? (
          <p className="text-sm text-hesya-navy-900/55">—</p>
        ) : (
          <ul className="space-y-3">
            {staffList.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-4 rounded-2xl border border-hesya-peach-100 bg-white px-5 py-4"
              >
                <p className="text-base font-medium text-hesya-navy-900">
                  {person.name}
                </p>
                {person.languages && person.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {person.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full bg-hesya-peach-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-hesya-navy-900/70"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 flex items-center justify-between rounded-2xl bg-hesya-navy-900 px-6 py-5 text-hesya-peach-50">
        <p className="text-sm">{t("eyebrow")}</p>
        <Link
          href={`/c/store/${store.id}/book/schedule`}
          className="rounded-full bg-hesya-amber-500 px-5 py-2 text-sm font-semibold text-hesya-navy-900 hover:bg-hesya-amber-400"
        >
          {t("bookCta")}
        </Link>
      </div>
    </main>
  );
}
