"use client";

import { useState } from "react";

import { createBookingAction } from "@/lib/booking/customer-actions";
import { useRouter } from "@/i18n/navigation";

type PaymentMethod = "stripe" | "alipay" | "wechat";

export interface MockPaymentLabels {
  readonly methodLabel: string;
  readonly methodStripe: string;
  readonly methodAlipay: string;
  readonly methodWechat: string;
  readonly cardNumberLabel: string;
  readonly cardExpiryLabel: string;
  readonly cardCvcLabel: string;
  readonly qrScanNote: string;
  readonly amountLabel: string;
  readonly amountValue: string;
  readonly submit: string;
  readonly errorGeneric: string;
}

interface Props {
  readonly storeId: string;
  readonly locale: string;
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

export function MockPaymentForm({ storeId, locale, transit, labels }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    const mockTxId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      paymentMethod: method,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-hesya-navy-900">
          {labels.methodLabel}
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "stripe", label: labels.methodStripe },
              { value: "alipay", label: labels.methodAlipay },
              { value: "wechat", label: labels.methodWechat },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                method === opt.value
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {method === "stripe" ? (
        <section className="space-y-3 rounded-2xl border border-hesya-peach-100 bg-white px-5 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
              {labels.cardNumberLabel}
            </label>
            <p className="rounded-lg bg-hesya-peach-50/50 px-4 py-2.5 font-mono text-sm tracking-wider text-hesya-navy-900">
              {FAKE_CARD_DISPLAY}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
                {labels.cardExpiryLabel}
              </label>
              <p className="rounded-lg bg-hesya-peach-50/50 px-4 py-2.5 font-mono text-sm text-hesya-navy-900">
                {FAKE_EXPIRY}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
                {labels.cardCvcLabel}
              </label>
              <p className="rounded-lg bg-hesya-peach-50/50 px-4 py-2.5 font-mono text-sm text-hesya-navy-900">
                {FAKE_CVC}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-hesya-peach-100 bg-white px-5 py-8">
          <div
            aria-label={`${method} QR placeholder`}
            className="grid h-44 w-44 grid-cols-8 grid-rows-8 gap-0.5 rounded-lg bg-hesya-peach-50/40 p-2"
          >
            {Array.from({ length: 64 }).map((_, i) => {
              // 의사 랜덤 QR 패턴 — 단순한 i*7 % 3 패턴으로 색칠.
              const filled = (i * 7) % 3 !== 0;
              return (
                <div
                  key={i}
                  className={`rounded-[1px] ${filled ? "bg-hesya-navy-900" : "bg-transparent"}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-hesya-navy-900/65">{labels.qrScanNote}</p>
        </section>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-hesya-peach-50/40 px-5 py-4">
        <span className="text-sm text-hesya-navy-900/70">
          {labels.amountLabel}
        </span>
        <span className="text-lg font-semibold text-hesya-navy-900">
          {labels.amountValue}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={processing}
        className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition ${
          processing
            ? "cursor-wait bg-hesya-navy-900/70 text-hesya-peach-50"
            : "bg-hesya-navy-900 text-hesya-peach-50 hover:bg-hesya-navy-800"
        }`}
      >
        {processing ? "…" : labels.submit}
      </button>
    </form>
  );
}
