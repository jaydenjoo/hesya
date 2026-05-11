import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  bookings as bookingsTable,
  createDbClient,
  eq,
  services as servicesTable,
  staff as staffTable,
} from "@hesya/database";

import { HospitalityHero } from "@/features/booking-success/hospitality-hero";
import { MapCard } from "@/features/booking-success/map-card";
import { MockQr } from "@/features/booking-success/mock-qr";
import { NextStepsTimeline } from "@/features/booking-success/next-steps-timeline";
import { BookingProgressStrip } from "@/features/customer-frame/booking-progress-strip";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AddressShape = { line1?: string; city?: string; country?: string };

function buildAddressText(address: unknown, fallback: string): string {
  if (!address || typeof address !== "object") return fallback;
  const a = address as AddressShape;
  return [a.line1, a.city, a.country].filter(Boolean).join(", ") || fallback;
}

/**
 * Plan v3 M2.6 / Phase D2-B1 — 예약 완료 페이지 (디자인 정합 재구성).
 *
 * 공통 frame + progress strip(done) + hospitality hero + QR card + next-steps
 * timeline + map card. 외국인 손님의 마지막 인상 (소셜 공유로 이어질 가능성)
 * 의 핵심 페이지.
 */
export default async function StorePaySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { locale, id } = await params;
  const { bookingId } = await searchParams;

  if (!UUID_RE.test(id)) notFound();
  if (!bookingId || !UUID_RE.test(bookingId)) notFound();

  const db = createDbClient(env.DATABASE_URL);
  const [bookingRow] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!bookingRow || bookingRow.storeId !== id) {
    notFound();
  }

  const [storePublic, svcRowArr, stfRowArr] = await Promise.all([
    getStorePublicById(db, id),
    bookingRow.serviceId
      ? db
          .select({
            nameKo: servicesTable.nameKo,
            nameEn: servicesTable.nameEn,
            nameJa: servicesTable.nameJa,
          })
          .from(servicesTable)
          .where(eq(servicesTable.id, bookingRow.serviceId))
          .limit(1)
      : Promise.resolve([null] as const),
    bookingRow.staffId
      ? db
          .select({ name: staffTable.name })
          .from(staffTable)
          .where(eq(staffTable.id, bookingRow.staffId))
          .limit(1)
      : Promise.resolve([null] as const),
  ]);

  const svcRow = svcRowArr[0];
  const stfRow = stfRowArr[0];

  const t = await getTranslations({ locale, namespace: "BookSuccess" });
  const tProgress = await getTranslations({
    locale,
    namespace: "BookingProgress",
  });

  const serviceLabel =
    locale === "en"
      ? (svcRow?.nameEn ?? svcRow?.nameKo)
      : locale === "ja"
        ? (svcRow?.nameJa ?? svcRow?.nameKo)
        : svcRow?.nameKo;

  const displayDateTime = bookingRow.scheduledAt
    ? new Intl.DateTimeFormat(locale, {
        timeZone: "Asia/Seoul",
        dateStyle: "long",
        timeStyle: "short",
      }).format(bookingRow.scheduledAt)
    : "-";

  const addressText = buildAddressText(
    storePublic?.address,
    storePublic?.name ?? "Hesya store",
  );

  return (
    <CustomerFrame>
      <BookingProgressStrip
        current="done"
        labels={{
          schedule: tProgress("schedule"),
          confirm: tProgress("confirm"),
          pay: tProgress("pay"),
          done: tProgress("done"),
        }}
      />

      <HospitalityHero subtitle={t("hospitalitySubtitle")} />

      <div className="space-y-4 px-5 pb-8">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {t("heading")}
          </h1>
          <p className="mt-2 text-[13px] text-hesya-navy-900/70 leading-relaxed">
            {t("subheading")}
          </p>
        </header>

        <section className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-5">
          <div className="flex flex-col items-center text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
              {t("qrCardTitle")}
            </p>
            <MockQr bookingId={bookingRow.id} />
            <p className="mt-3 font-mono text-[10px] text-hesya-navy-900/55">
              {bookingRow.id.slice(0, 8)}…{bookingRow.id.slice(-4)}
            </p>
            <p className="mt-2 text-[11px] text-hesya-navy-900/55">
              {t("qrCardNote")}
            </p>
          </div>

          <dl className="mt-5 space-y-2 border-t border-hesya-peach-100 pt-4 text-[13px]">
            {serviceLabel && (
              <div className="flex justify-between gap-3">
                <dt className="text-hesya-navy-900/55">{t("service")}</dt>
                <dd className="text-right font-medium text-hesya-navy-900">
                  {serviceLabel}
                </dd>
              </div>
            )}
            {stfRow && (
              <div className="flex justify-between gap-3">
                <dt className="text-hesya-navy-900/55">{t("staff")}</dt>
                <dd className="text-right font-medium text-hesya-navy-900">
                  {stfRow.name}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-hesya-navy-900/55">{t("datetime")}</dt>
              <dd className="text-right font-medium text-hesya-navy-900">
                {displayDateTime}
              </dd>
            </div>
          </dl>
        </section>

        <NextStepsTimeline
          title={t("timelineTitle")}
          steps={[
            t("timelineStep1"),
            t("timelineStep2"),
            t("timelineStep3"),
            t("timelineStep4"),
            t("timelineStep5"),
          ]}
        />

        <MapCard
          title={t("mapCardTitle")}
          addressText={addressText}
          labels={{
            apple: t("mapApple"),
            google: t("mapGoogle"),
            naver: t("mapNaver"),
          }}
        />

        <p className="text-center text-[11px] text-hesya-navy-900/55">
          {t("savedNote")}
        </p>

        <div className="pt-2 text-center">
          <Link
            href={`/c/store/${id}`}
            className="inline-block rounded-full bg-hesya-navy-900 px-6 py-2.5 text-[13px] font-semibold text-hesya-peach-50 hover:bg-hesya-navy-900/90"
          >
            {t("backToStore")}
          </Link>
        </div>
      </div>
    </CustomerFrame>
  );
}
