import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient, eq } from "@hesya/database";
import { bookings as bookingsTable } from "@hesya/database";
import { services as servicesTable } from "@hesya/database";
import { staff as staffTable } from "@hesya/database";

import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Plan v3 M2.6 — 예약 완료 페이지. createBookingAction이 booking + payment row
 * 를 atomic insert한 후 redirect로 도래. bookingId를 search param으로 받아서
 * 손님이 확인 가능한 정보 표시 (예약 ID, 시술, 디자이너, 일시).
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

  const [svcRow] = bookingRow.serviceId
    ? await db
        .select({
          nameKo: servicesTable.nameKo,
          nameEn: servicesTable.nameEn,
          nameJa: servicesTable.nameJa,
        })
        .from(servicesTable)
        .where(eq(servicesTable.id, bookingRow.serviceId))
        .limit(1)
    : [null];

  const [stfRow] = bookingRow.staffId
    ? await db
        .select({ name: staffTable.name })
        .from(staffTable)
        .where(eq(staffTable.id, bookingRow.staffId))
        .limit(1)
    : [null];

  const t = await getTranslations({ locale, namespace: "BookSuccess" });

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

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-hesya-amber-50 text-4xl text-hesya-amber-600">
          ✓
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm text-hesya-navy-900/70">{t("subheading")}</p>
      </header>

      <section className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-hesya-navy-900/55">{t("bookingId")}</dt>
            <dd className="break-all text-right font-mono text-xs text-hesya-navy-900">
              {bookingRow.id}
            </dd>
          </div>
          {serviceLabel && (
            <div className="flex justify-between gap-4">
              <dt className="text-hesya-navy-900/55">{t("service")}</dt>
              <dd className="text-right font-medium text-hesya-navy-900">
                {serviceLabel}
              </dd>
            </div>
          )}
          {stfRow && (
            <div className="flex justify-between gap-4">
              <dt className="text-hesya-navy-900/55">{t("staff")}</dt>
              <dd className="text-right font-medium text-hesya-navy-900">
                {stfRow.name}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-hesya-navy-900/55">{t("datetime")}</dt>
            <dd className="text-right font-medium text-hesya-navy-900">
              {displayDateTime}
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-6 text-center text-xs text-hesya-navy-900/55">
        {t("savedNote")}
      </p>

      <div className="mt-8 text-center">
        <Link
          href={`/c/store/${id}`}
          className="inline-block rounded-full bg-hesya-navy-900 px-6 py-2.5 text-sm font-semibold text-hesya-peach-50 hover:bg-hesya-navy-800"
        >
          {t("backToStore")}
        </Link>
      </div>
    </main>
  );
}
