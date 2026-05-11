"use client";

/**
 * Plan v3 M2.5 / Phase D2-B4 — Mock 결제 form (디자인 정합 재구성).
 *
 * 디자인 레퍼런스 정합: 8 결제수단 method-scroll tile + Trust row 4 pill +
 * Order summary (Subtotal/Deposit/Remaining) + 다중 통화 환산 + Sticky bottom
 * Pay CTA.
 *
 * 실 결제 connector는 KYB 후. 본 form은 UI + booking insert 트리거만.
 */

import { useState } from "react";

import { createBookingAction } from "@/lib/booking/customer-actions";
import { TrustPill } from "@/features/customer-frame/badges/trust-pill";
import { useRouter } from "@/i18n/navigation";

type PaymentMethod =
  | "card"
  | "alipay"
  | "wechat"
  | "linepay"
  | "paypay"
  | "unionpay"
  | "applepay"
  | "googlepay";

const ALL_METHODS: ReadonlyArray<{
  readonly value: PaymentMethod;
  readonly icon: string;
  readonly bg: string;
  readonly suggested?: boolean;
}> = [
  { value: "card", icon: "▭", bg: "bg-slate-100", suggested: true },
  { value: "alipay", icon: "支", bg: "bg-blue-100" },
  { value: "wechat", icon: "微", bg: "bg-emerald-100" },
  { value: "linepay", icon: "L", bg: "bg-green-100" },
  { value: "paypay", icon: "P", bg: "bg-red-100" },
  { value: "unionpay", icon: "U", bg: "bg-indigo-100" },
  { value: "applepay", icon: "", bg: "bg-neutral-100" },
  { value: "googlepay", icon: "G", bg: "bg-amber-100" },
];

export interface MockPaymentLabels {
  readonly methodLabel: string;
  readonly suggested: string;
  readonly methodCard: string;
  readonly methodAlipay: string;
  readonly methodWechat: string;
  readonly methodLinepay: string;
  readonly methodPaypay: string;
  readonly methodUnionpay: string;
  readonly methodApplepay: string;
  readonly methodGooglepay: string;
  readonly cardNumberLabel: string;
  readonly cardExpiryLabel: string;
  readonly cardCvcLabel: string;
  readonly qrScanNote: string;
  readonly walletTapNote: string;
  readonly trustSsl: string;
  readonly trustPci: string;
  readonly trustCancel: string;
  readonly trustGuarantee: string;
  readonly summaryTitle: string;
  readonly summarySubtotal: string;
  readonly summaryDeposit: string;
  readonly summaryRemaining: string;
  readonly approxLabel: string;
  readonly payNow: string;
  readonly termsNote: string;
  readonly errorGeneric: string;
}

interface Props {
  readonly storeId: string;
  readonly locale: string;
  readonly priceKrw: number;
  readonly primaryFormatted: string;
  readonly secondaryFormatted: string;
  readonly depositPrimary: string;
  readonly depositSecondary: string;
  readonly remainingPrimary: string;
  readonly transit: Readonly<{
    service: string;
    staff: string;
    date: string;
    time: string;
    name: string;
    email: string;
    message?: string;
  }>;
  readonly labels: MockPaymentLabels;
}

const FAKE_CARD_DISPLAY = "4242 4242 4242 4242";
const FAKE_EXPIRY = "12 / 28";
const FAKE_CVC = "123";

function methodLabel(m: PaymentMethod, labels: MockPaymentLabels): string {
  switch (m) {
    case "card":
      return labels.methodCard;
    case "alipay":
      return labels.methodAlipay;
    case "wechat":
      return labels.methodWechat;
    case "linepay":
      return labels.methodLinepay;
    case "paypay":
      return labels.methodPaypay;
    case "unionpay":
      return labels.methodUnionpay;
    case "applepay":
      return labels.methodApplepay;
    case "googlepay":
      return labels.methodGooglepay;
  }
}

export function MockPaymentForm({
  storeId,
  locale,
  primaryFormatted,
  secondaryFormatted,
  depositPrimary,
  depositSecondary,
  remainingPrimary,
  transit,
  labels,
}: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    const mockTxId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // server action은 stripe/alipay/wechat만 받음 — UI 확장과 무관하게 wallet
    // 류는 stripe로 기록 (M5 정식 결제 connector 도입 시 type 확장 예정).
    const wireMethod: "stripe" | "alipay" | "wechat" =
      method === "alipay"
        ? "alipay"
        : method === "wechat"
          ? "wechat"
          : "stripe";
    const result = await createBookingAction({
      storeId,
      serviceId: transit.service,
      staffId: transit.staff,
      date: transit.date,
      time: transit.time,
      name: transit.name,
      email: transit.email,
      message: transit.message,
      locale,
      paymentMethod: wireMethod,
      mockTxId,
    });
    if (!result.ok) {
      setError(result.message || labels.errorGeneric);
      setProcessing(false);
      return;
    }
    router.push(
      `/c/store/${storeId}/pay/success?bookingId=${result.bookingId}`,
    );
  };

  const showCard = method === "card";
  const showWallet =
    method === "applepay" || method === "googlepay" || method === "linepay";
  const showQr = !showCard && !showWallet;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24">
      <fieldset>
        <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
          {labels.methodLabel}
        </legend>
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {ALL_METHODS.map((opt) => {
            const active = method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={[
                  "relative flex w-[88px] flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition",
                  active
                    ? "border-hesya-navy-900 bg-white shadow-[0_4px_12px_-4px_rgba(26,34,56,0.25)]"
                    : "border-hesya-peach-200 bg-white hover:border-hesya-amber-500",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 place-items-center rounded-lg ${opt.bg} font-mono text-[14px] font-bold text-hesya-navy-900`}
                >
                  {opt.icon}
                </span>
                <span className="text-center text-[10px] font-semibold leading-tight text-hesya-navy-900">
                  {methodLabel(opt.value, labels)}
                </span>
                {opt.suggested ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-hesya-amber-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {showCard ? (
        <section className="space-y-3 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
              {labels.cardNumberLabel}
            </label>
            <p className="rounded-lg bg-hesya-peach-50/60 px-3 py-2.5 font-mono text-[13px] tracking-wider text-hesya-navy-900">
              {FAKE_CARD_DISPLAY}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.cardExpiryLabel}
              </label>
              <p className="rounded-lg bg-hesya-peach-50/60 px-3 py-2.5 font-mono text-[13px] text-hesya-navy-900">
                {FAKE_EXPIRY}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.cardCvcLabel}
              </label>
              <p className="rounded-lg bg-hesya-peach-50/60 px-3 py-2.5 font-mono text-[13px] text-hesya-navy-900">
                {FAKE_CVC}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {showQr ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-6">
          <div
            aria-label={`${method} QR placeholder`}
            className="grid h-36 w-36 grid-cols-8 grid-rows-8 gap-0.5 rounded-md bg-hesya-peach-50/40 p-2"
          >
            {Array.from({ length: 64 }).map((_, i) => {
              const filled = (i * 7) % 3 !== 0;
              return (
                <div
                  key={i}
                  className={`rounded-[1px] ${filled ? "bg-hesya-navy-900" : "bg-transparent"}`}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-hesya-navy-900/65">
            {labels.qrScanNote}
          </p>
        </section>
      ) : null}

      {showWallet ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-8">
          <span
            aria-hidden="true"
            className="text-[36px] text-hesya-navy-900/35"
          >
            ⌖
          </span>
          <p className="text-[11px] text-hesya-navy-900/65">
            {labels.walletTapNote}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-hesya-peach-200 bg-white px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
          {labels.summaryTitle}
        </p>
        <dl className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/65">{labels.summarySubtotal}</dt>
            <dd className="text-right">
              <span className="font-mono font-medium text-hesya-navy-900">
                {primaryFormatted}
              </span>
              <span className="ml-1.5 text-[11px] text-hesya-navy-900/45">
                {labels.approxLabel} {secondaryFormatted}
              </span>
            </dd>
          </div>
          <div className="flex justify-between border-t border-hesya-peach-100 pt-2">
            <dt className="font-semibold text-hesya-navy-900">
              {labels.summaryDeposit}
            </dt>
            <dd className="text-right">
              <span className="font-mono font-semibold text-hesya-navy-900">
                {depositPrimary}
              </span>
              <span className="ml-1.5 text-[11px] text-hesya-navy-900/45">
                {labels.approxLabel} {depositSecondary}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/55">
              {labels.summaryRemaining}
            </dt>
            <dd className="font-mono text-hesya-navy-900/65">
              {remainingPrimary}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap gap-1.5">
        <TrustPill icon="🔒" label={labels.trustSsl} />
        <TrustPill icon="💳" label={labels.trustPci} />
        <TrustPill icon="↩" label={labels.trustCancel} />
        <TrustPill icon="🛡" label={labels.trustGuarantee} />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-0 z-20 -mx-5 flex flex-col gap-2 border-t border-hesya-peach-200 bg-hesya-peach-50/95 px-5 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={processing}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition",
            processing
              ? "cursor-wait bg-hesya-navy-900/70 text-hesya-peach-50"
              : "bg-hesya-navy-900 text-hesya-peach-50 hover:bg-hesya-navy-900/90",
          ].join(" ")}
        >
          {processing ? (
            "…"
          ) : (
            <>
              <span>{labels.payNow}</span>
              <span className="font-mono">{depositPrimary}</span>
              <span className="text-[11px] text-hesya-peach-50/65">
                {labels.approxLabel} {depositSecondary}
              </span>
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-hesya-navy-900/45">
          {labels.termsNote}
        </p>
      </div>
    </form>
  );
}
