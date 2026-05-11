import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import {
  PhotoLightbox,
  type LightboxPhoto,
} from "@/features/store-detail-customer/photo-lightbox";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Plan v3 M2.2 / Phase D2-B5 — customer-side public 매장 사진 gallery
 * (디자인 정합 보완).
 *
 * CustomerFrame wrap (peach gradient + 데스크톱 iPhone-frame). 사진 클릭 시
 * fullscreen lightbox (ESC / 좌우 화살표 / 클릭 close).
 *
 * `staff.portfolio_urls` flatten — 정식 매장 사진 컬럼은 M5+ schema 확장 시.
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
  const t = await getTranslations({ locale, namespace: "StorePhotos" });

  const photos: LightboxPhoto[] = staffList.flatMap((person) =>
    (person.portfolioUrls ?? []).map((url) => ({
      url,
      caption: t("by", { name: person.name }),
    })),
  );

  return (
    <CustomerFrame>
      <div className="px-5 pb-8 pt-6">
        <header className="mb-6 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-[26px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {store.name}
          </h1>
          <p className="text-[12px] text-hesya-navy-900/65">{t("subtitle")}</p>
          <Link
            href={`/c/store/${store.id}`}
            className="inline-block pt-1 text-[12px] text-hesya-amber-600 hover:underline"
          >
            ← {t("backToStore")}
          </Link>
        </header>

        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
          {t("heading")}
        </h2>

        <PhotoLightbox
          photos={photos}
          emptyLabel={t("empty")}
          closeLabel={t("lightboxClose")}
          prevLabel={t("lightboxPrev")}
          nextLabel={t("lightboxNext")}
        />
      </div>
    </CustomerFrame>
  );
}
