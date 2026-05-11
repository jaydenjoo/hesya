import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient, eq } from "@hesya/database";
import { services as servicesTable } from "@hesya/database";

import { MockPaymentForm } from "@/features/booking-customer/mock-payment-form";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/**
 * Plan v3 M2.5 — Mock 결제 페이지.
 *
 * MOCK_PAYMENT=true일 때만 가짜 결제 UI 노출. false면 "준비 중" 안내.
 * 본 페이지는 결제 UI 시각만 — 실 booking insert + payments row insert는
 * M2.6 server action 책임. "결제 완료" 버튼 → /pay/success로 navigation.
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

  // MOCK_PAYMENT가 꺼져있으면 정식 결제 페이지 도래 전 — 안내만 표시.
  if (!env.MOCK_PAYMENT) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-2xl border border-hesya-amber-500/30 bg-hesya-amber-50 px-6 py-8 text-center">
          <h1
            className="mb-3 text-2xl font-semibold text-hesya-navy-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("disabledTitle")}
          </h1>
          <p className="text-sm text-hesya-navy-900/70">{t("disabledBody")}</p>
        </div>
        <Link
          href={`/c/store/${id}`}
          className="mt-6 inline-block text-sm text-hesya-amber-600 hover:underline"
        >
          ← 매장으로 돌아가기
        </Link>
      </main>
    );
  }

  // Mock 모드 활성 — 필수 search params 검증.
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
    <main className="mx-auto max-w-xl px-6 py-12">
      <header className="mb-8 space-y-2">
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
      </header>

      <div className="mb-6 rounded-2xl border border-hesya-amber-500/40 bg-hesya-amber-50/60 px-5 py-4">
        <p className="text-xs font-semibold text-hesya-navy-900">
          {t("mockWarningTitle")}
        </p>
        <p className="mt-1 text-xs text-hesya-navy-900/70">
          {t("mockWarningBody")}
        </p>
      </div>

      <MockPaymentForm
        storeId={store.id}
        locale={locale}
        transit={transit}
        labels={{
          methodLabel: t("methodLabel"),
          methodStripe: t("methodStripe"),
          methodAlipay: t("methodAlipay"),
          methodWechat: t("methodWechat"),
          cardNumberLabel: t("cardNumberLabel"),
          cardExpiryLabel: t("cardExpiryLabel"),
          cardCvcLabel: t("cardCvcLabel"),
          qrScanNote: t("qrScanNote"),
          amountLabel: t("amountLabel"),
          amountValue: `₩${svcRow.priceKrw.toLocaleString("ko-KR")}`,
          submit: t("submit"),
          errorGeneric: "결제 처리 중 오류가 발생했습니다.",
        }}
      />
    </main>
  );
}
