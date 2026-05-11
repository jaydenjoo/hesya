import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient, eq } from "@hesya/database";
import { services as servicesTable } from "@hesya/database";
import { staff as staffTable } from "@hesya/database";

import { BookConfirmForm } from "@/features/booking-customer/book-confirm-form";
import { combineToIso } from "@/features/booking-customer/time-slots";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

type ServiceNameKey =
  | "nameKo"
  | "nameEn"
  | "nameJa"
  | "nameZhCn"
  | "nameZhTw"
  | "nameVi";

function pickServiceName(
  svc: { nameKo: string } & Partial<Record<ServiceNameKey, string | null>>,
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
  return svc[map[locale] ?? "nameKo"] ?? svc.nameKo;
}

/**
 * Plan v3 M2.4 — customer-side 예약 확정 폼.
 *
 * schedule 단계의 4 search params (service/staff/date/time) 받아서 preview +
 * 손님 정보 폼 표시. 폼 제출 시 URL params를 그대로 stash해서 `/pay`로 이동.
 * 본 페이지는 booking insert 안 함 (M2.6 server action 책임).
 *
 * 잘못된 search params (UUID/날짜 형식 오류) → notFound.
 */
export default async function StoreBookConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    service?: string;
    staff?: string;
    date?: string;
    time?: string;
  }>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(id)) notFound();
  const serviceId = sp.service;
  const staffId = sp.staff;
  const date = sp.date;
  const time = sp.time;
  if (
    !serviceId ||
    !staffId ||
    !date ||
    !time ||
    !UUID_RE.test(serviceId) ||
    !UUID_RE.test(staffId) ||
    !DATE_RE.test(date) ||
    !TIME_RE.test(time)
  ) {
    notFound();
  }

  const db = createDbClient(env.DATABASE_URL);
  const store = await getStorePublicById(db, id);
  if (!store) notFound();

  const [svcRow] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, serviceId))
    .limit(1);
  const [stfRow] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.id, staffId))
    .limit(1);

  if (
    !svcRow ||
    !stfRow ||
    svcRow.storeId !== store.id ||
    stfRow.storeId !== store.id
  ) {
    // 다른 매장의 service/staff로 변조한 URL은 404로 위장.
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "BookConfirm" });
  const tStoreDetail = await getTranslations({
    locale,
    namespace: "StoreDetail",
  });

  const isoDateTime = combineToIso(date, time);
  const displayDateTime = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(isoDateTime));

  const serviceLabel = pickServiceName(svcRow, locale);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          {t("eyebrow")}
        </p>
        <h1
          className="text-3xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          {t("heading")}
        </h1>
        <p className="text-sm text-hesya-navy-900/70">{t("subheading")}</p>
        <Link
          href={`/c/store/${store.id}/book/schedule`}
          className="inline-block text-sm text-hesya-amber-600 hover:underline"
        >
          ← {tStoreDetail("title", { name: store.name })}
        </Link>
      </header>

      <section className="mb-8 rounded-2xl border border-hesya-peach-100 bg-hesya-peach-50/30 px-6 py-5">
        <h2 className="mb-4 text-sm font-semibold text-hesya-navy-900">
          {t("summaryHeading")}
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-hesya-navy-900/55">{t("service")}</dt>
            <dd className="text-right font-medium text-hesya-navy-900">
              {serviceLabel} ·{" "}
              {tStoreDetail("priceKrw", {
                price: svcRow.priceKrw.toLocaleString("ko-KR"),
              })}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-hesya-navy-900/55">{t("staff")}</dt>
            <dd className="text-right font-medium text-hesya-navy-900">
              {stfRow.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-hesya-navy-900/55">{t("datetime")}</dt>
            <dd className="text-right font-medium text-hesya-navy-900">
              {displayDateTime}
            </dd>
          </div>
        </dl>
      </section>

      <BookConfirmForm
        storeId={store.id}
        transit={{ service: serviceId, staff: staffId, date, time }}
        labels={{
          formHeading: t("formHeading"),
          nameLabel: t("nameLabel"),
          namePlaceholder: t("namePlaceholder"),
          emailLabel: t("emailLabel"),
          emailPlaceholder: t("emailPlaceholder"),
          messageLabel: t("messageLabel"),
          messagePlaceholder: t("messagePlaceholder"),
          submit: t("submit"),
          required: t("required"),
          privacyNote: t("privacyNote"),
          incomplete: t("incomplete"),
        }}
      />
    </main>
  );
}
