import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient, eq, services as servicesTable } from "@hesya/database";

import {
  formatPriceForLocale,
  getSecondaryCurrencyDisplay,
} from "@/features/booking-customer/currency";
import { getCachedExchangeRates } from "@/lib/exchange-rate/fetch";
import { MockPaymentForm } from "@/features/booking-customer/mock-payment-form";
import { BookingProgressStrip } from "@/features/customer-frame/booking-progress-strip";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DEPOSIT_PCT = 0.3;

/**
 * Plan v3 M2.5 / Phase D2-B4 — Mock 결제 페이지 (디자인 정합 재구성).
 *
 * CustomerFrame + Progress strip(pay) + "Almost there." hero + 8 결제수단
 * method-scroll + Trust row + Order summary (Subtotal/Deposit/Remaining) +
 * sticky bottom Pay CTA.
 *
 * 청구 통화는 항상 KRW (시연용 정적 환율). 실 결제 connector는 KYB 후.
 */
export default async function StoreMockPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    service?: string;
    staff?: string;
    date?: string;
    time?: string;
    name?: string;
    email?: string;
    message?: string;
  }>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(id)) notFound();

  const t = await getTranslations({ locale, namespace: "MockPayment" });
  const tProgress = await getTranslations({
    locale,
    namespace: "BookingProgress",
  });

  if (!env.MOCK_PAYMENT) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-2xl border border-hesya-amber-500/30 bg-hesya-amber-50 px-6 py-8 text-center">
          <h1 className="mb-3 font-heading text-2xl font-semibold italic text-hesya-navy-900">
            {t("disabledTitle")}
          </h1>
          <p className="text-sm text-hesya-navy-900/70">{t("disabledBody")}</p>
        </div>
        <Link
          href={`/c/store/${id}`}
          className="mt-6 inline-block text-sm text-hesya-amber-600 hover:underline"
        >
          ← {t("backToStore")}
        </Link>
      </main>
    );
  }

  if (
    !sp.service ||
    !sp.staff ||
    !sp.date ||
    !sp.time ||
    !sp.name ||
    !sp.email ||
    !UUID_RE.test(sp.service) ||
    !UUID_RE.test(sp.staff) ||
    !DATE_RE.test(sp.date) ||
    !TIME_RE.test(sp.time)
  ) {
    notFound();
  }

  const db = createDbClient(env.DATABASE_URL);
  const store = await getStorePublicById(db, id);
  if (!store) notFound();

  const [svcRow] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, sp.service))
    .limit(1);

  if (!svcRow || svcRow.storeId !== store.id) {
    notFound();
  }

  const totalKrw = svcRow.priceKrw;
  const depositKrw = Math.round(totalKrw * DEPOSIT_PCT);
  const remainingKrw = totalKrw - depositKrw;

  // Plan v4 Epic D — Frankfurter 실시간 환율 (1h cache). 실패 시 정적 fallback.
  const rates = await getCachedExchangeRates();

  const transit = {
    service: sp.service as string,
    staff: sp.staff as string,
    date: sp.date as string,
    time: sp.time as string,
    name: sp.name as string,
    email: sp.email as string,
    ...(sp.message ? { message: sp.message } : {}),
  } as const;

  return (
    <CustomerFrame>
      <BookingProgressStrip
        current="pay"
        labels={{
          schedule: tProgress("schedule"),
          confirm: tProgress("confirm"),
          pay: tProgress("pay"),
          done: tProgress("done"),
        }}
      />

      <div className="px-5 pb-4 pt-3">
        <header className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 font-heading text-[28px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {t("heading")}
          </h1>
          <p className="mt-1.5 text-[13px] text-hesya-navy-900/70">
            {t("subheading")}
          </p>
        </header>

        <div className="mb-4 rounded-xl border border-hesya-amber-500/40 bg-hesya-amber-50/60 px-4 py-2.5">
          <p className="text-[11px] font-semibold text-hesya-navy-900">
            {t("mockWarningTitle")}
          </p>
          <p className="mt-0.5 text-[11px] text-hesya-navy-900/70">
            {t("mockWarningBody")}
          </p>
        </div>

        <MockPaymentForm
          storeId={store.id}
          locale={locale}
          priceKrw={totalKrw}
          primaryFormatted={formatPriceForLocale(totalKrw, locale, rates)}
          secondaryFormatted={getSecondaryCurrencyDisplay(
            totalKrw,
            locale,
            rates,
          )}
          depositPrimary={formatPriceForLocale(depositKrw, locale, rates)}
          depositSecondary={getSecondaryCurrencyDisplay(
            depositKrw,
            locale,
            rates,
          )}
          remainingPrimary={formatPriceForLocale(remainingKrw, locale, rates)}
          transit={transit}
          labels={{
            methodLabel: t("methodLabel"),
            suggested: t("suggested"),
            methodCard: t("methodCard"),
            methodAlipay: t("methodAlipay"),
            methodWechat: t("methodWechat"),
            methodLinepay: t("methodLinepay"),
            methodPaypay: t("methodPaypay"),
            methodUnionpay: t("methodUnionpay"),
            methodApplepay: t("methodApplepay"),
            methodGooglepay: t("methodGooglepay"),
            cardNumberLabel: t("cardNumberLabel"),
            cardExpiryLabel: t("cardExpiryLabel"),
            cardCvcLabel: t("cardCvcLabel"),
            qrScanNote: t("qrScanNote"),
            walletTapNote: t("walletTapNote"),
            trustSsl: t("trustSsl"),
            trustPci: t("trustPci"),
            trustCancel: t("trustCancel"),
            trustGuarantee: t("trustGuarantee"),
            summaryTitle: t("summaryTitle"),
            summarySubtotal: t("summarySubtotal"),
            summaryDeposit: t("summaryDeposit"),
            summaryRemaining: t("summaryRemaining"),
            approxLabel: t("approxLabel"),
            payNow: t("payNow"),
            termsNote: t("termsNote"),
            errorGeneric: t("errorGeneric"),
          }}
        />
      </div>
    </CustomerFrame>
  );
}
