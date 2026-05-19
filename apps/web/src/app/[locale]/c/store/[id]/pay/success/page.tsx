import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  bookings as bookingsTable,
  createDbClient,
  customers as customersTable,
  eq,
  services as servicesTable,
  staff as staffTable,
} from "@hesya/database";

import { AppointmentCard } from "@/features/booking-success/appointment-card";
import { HospitalityHero } from "@/features/booking-success/hospitality-hero";
import { MapCard } from "@/features/booking-success/map-card";
import { MockQr } from "@/features/booking-success/mock-qr";
import { NextStepsTimeline } from "@/features/booking-success/next-steps-timeline";
import { SafetyTips } from "@/features/booking-success/safety-tips";
import { StoryShareCard } from "@/features/booking-success/story-share-card";
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

function formatBookingCode(
  bookingId: string,
  scheduledAt: Date | null,
): string {
  const year = (scheduledAt ?? new Date()).getUTCFullYear();
  const tail = bookingId.replace(/-/g, "").slice(-4).toUpperCase();
  return `HSYA-${year}-${tail}`;
}

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

  const [storePublic, svcRowArr, stfRowArr, custRowArr] = await Promise.all([
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
    bookingRow.customerId
      ? db
          .select({ name: customersTable.name })
          .from(customersTable)
          .where(eq(customersTable.id, bookingRow.customerId))
          .limit(1)
      : Promise.resolve([null] as const),
  ]);

  const svcRow = svcRowArr[0];
  const stfRow = stfRowArr[0];
  const custRow = custRowArr[0];

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

  const shortDate = bookingRow.scheduledAt
    ? new Intl.DateTimeFormat(locale, {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(bookingRow.scheduledAt)
    : "-";

  const addressText = buildAddressText(
    storePublic?.address,
    storePublic?.name ?? "Hesya store",
  );
  const customerName = custRow?.name ?? "";
  const bookingCode = formatBookingCode(bookingRow.id, bookingRow.scheduledAt);
  const storeName = storePublic?.name ?? "—";

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

      <p className="text-center font-heading text-[14px] italic tracking-[0.05em] text-hesya-amber-600">
        {t("calligraphy")}
      </p>

      <HospitalityHero
        headingTemplate={t("headingTemplate")}
        customerName={customerName}
      />

      <div className="slide-up-result space-y-4 px-5 pb-8">
        <header className="text-center">
          <p className="text-[13px] text-hesya-navy-900/70 leading-relaxed">
            {t("subheading")}
          </p>
        </header>

        <section className="relative rounded-[24px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(26,34,56,0.08)]">
          <button
            type="button"
            aria-label={t("shareAriaLabel")}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-hesya-peach-100 text-hesya-amber-600 transition hover:bg-hesya-peach-200"
          >
            <span aria-hidden="true" className="text-[14px]">
              ↗
            </span>
          </button>
          <div className="flex flex-col items-center text-center">
            <p className="text-[12px] font-medium text-hesya-navy-900/70 [word-break:keep-all]">
              {storeName}
            </p>
            {/* Reference booking.css L129-136 .qr-box — 200×200 + r-16 */}
            <div className="mt-3 rounded-2xl border-2 border-hesya-navy-900 p-2">
              <MockQr bookingId={bookingRow.id} size={200} />
            </div>
            <p className="mono mt-3 text-[13px] tracking-[0.05em] text-hesya-navy-900">
              {bookingCode}
            </p>
            <p className="mt-2 text-[11px] text-hesya-navy-900/55">
              {t("qrCardNote")}
            </p>
          </div>
        </section>

        <StoryShareCard
          title={t("storyShareTitle")}
          subtitle={t("storyShareSubtitle")}
          brandLabel={t("storyShareBrand")}
          customerName={customerName || t("storyShareGuestFallback")}
          serviceText={serviceLabel ?? t("storyShareServiceFallback")}
          dateText={shortDate}
          locationText={storeName}
          handle={t("storyShareHandle")}
          tagLine={t("storyShareTagLine")}
          actions={{
            save: t("storyShareSave"),
            send: t("storyShareSend"),
            copy: t("storyShareCopy"),
          }}
        />

        <AppointmentCard
          dateLine={displayDateTime}
          serviceLine={serviceLabel ?? "—"}
          staffLine={stfRow?.name}
          storeName={storeName}
          walkLine={t("apptWalkMock")}
          paymentPaid={t("apptPaidMock")}
          paymentDue={t("apptDueMock")}
          addToCalendar={t("apptAddToCalendar")}
        />

        <MapCard
          title={t("mapCardTitle")}
          addressText={addressText}
          labels={{
            apple: t("mapApple"),
            google: t("mapGoogle"),
            naver: t("mapNaver"),
            naverRecommended: t("naverRecommended"),
          }}
        />

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

        <SafetyTips
          title={t("safetyTitle")}
          tip1={t("safetyTip1")}
          tip2={t("safetyTip2")}
          tip3={t("safetyTip3")}
          firstOnly={t("safetyFirstOnly")}
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

        <nav
          aria-label={t("defensiveAriaLabel")}
          className="flex items-center justify-center gap-5 pt-1 text-[12px] text-hesya-navy-900/55"
        >
          <Link
            href={`/c/store/${id}`}
            className="transition hover:text-hesya-amber-600"
          >
            {t("modifyLink")} →
          </Link>
          <span aria-hidden="true" className="text-hesya-navy-900/20">
            ·
          </span>
          <Link
            href={`/c/store/${id}`}
            className="transition hover:text-hesya-amber-600"
          >
            {t("cancelLink")} →
          </Link>
        </nav>
      </div>
    </CustomerFrame>
  );
}
