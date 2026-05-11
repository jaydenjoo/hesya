import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PhotoCard = {
  url: string;
  staffName: string;
};

/**
 * Plan v3 M2.2 — customer-side public 매장 사진 gallery.
 *
 * 별도 `stores.photo_urls` 컬럼 없이 `staff.portfolio_urls`를 flatten해서 노출.
 * 디자이너 portfolio가 매장 대표 사진의 1순위 후보이기 때문. 정식 매장 자체
 * 사진 컬럼은 베타 출시 후 schema 확장 단계에서 추가 (M5+).
 *
 * `auto_approved` + soft-delete X 매장만 노출 (M2.1과 동일 가드).
 */
export default async function StorePhotosPage({
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

  const staffList = await listStaffByStore(db, store.id);
  const photos: PhotoCard[] = staffList.flatMap((person) =>
    (person.portfolioUrls ?? []).map((url) => ({
      url,
      staffName: person.name,
    })),
  );

  const t = await getTranslations({ locale, namespace: "StorePhotos" });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
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
        <p className="text-sm text-hesya-navy-900/70">{t("subtitle")}</p>
        <Link
          href={`/c/store/${store.id}`}
          className="inline-block text-sm text-hesya-amber-600 hover:underline"
        >
          {t("backToStore")}
        </Link>
      </header>

      <h2 className="mb-4 text-lg font-semibold text-hesya-navy-900">
        {t("heading")}
      </h2>

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((photo, idx) => (
            <li
              key={`${photo.url}-${idx}`}
              className="group overflow-hidden rounded-2xl border border-hesya-peach-100 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.staffName}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <p className="px-3 py-2 text-xs text-hesya-navy-900/65">
                {t("by", { name: photo.staffName })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
