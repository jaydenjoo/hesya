"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Booking } from "@hesya/database";

import { updateBookingStatusAction } from "@/lib/booking/actions";
import type { BookingStatus } from "@/shared/lib/dal/bookings";

type Props = {
  locale: string;
  booking: Booking;
  serviceLabel: string;
  staffLabel: string;
  /** Server-injected — purity 회피 (admin/disputes/[id]/page.tsx 동일 패턴). */
  nowMs: number;
  labels: {
    headers: {
      info: string;
      actions: string;
    };
    fields: {
      scheduled: string;
      service: string;
      staff: string;
      price: string;
      deposit: string;
      paymentMethod: string;
      status: string;
    };
    statuses: Record<string, string>;
    actions: {
      markCompleted: string;
      markNoShow: string;
      markCancelled: string;
      processing: string;
      terminalNote: string;
    };
  };
};

const TERMINAL_STATUSES: ReadonlyArray<BookingStatus> = [
  "completed",
  "cancelled",
  "no_show",
];

const STATUS_PILL_TONE: Record<
  string,
  { chip: string; dot: string; ring: string }
> = {
  scheduled: {
    chip: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  completed: {
    chip: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
    ring: "ring-gray-200",
  },
  cancelled: {
    chip: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  no_show: {
    chip: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
  },
};

export function BookingDetail({
  locale,
  booking,
  serviceLabel,
  staffLabel,
  nowMs,
  labels,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const currentStatus = (booking.status ?? "scheduled") as BookingStatus;
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);

  const dispatch = (next: BookingStatus) => () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateBookingStatusAction({
        bookingId: booking.id,
        status: next,
      });
      if (res.ok) {
        router.push(`/${locale}/store/bookings`);
        router.refresh();
        return;
      }
      setErrorMsg(res.message);
    });
  };

  const tone = STATUS_PILL_TONE[currentStatus] ?? STATUS_PILL_TONE.scheduled!;
  const hoursUntil = (booking.scheduledAt.getTime() - nowMs) / (1000 * 60 * 60);
  const isFuture = hoursUntil > 0 && currentStatus === "scheduled";
  const cancellationBand = !isFuture
    ? null
    : hoursUntil >= 24
      ? {
          tone: "ok" as const,
          text: `취소 시 전액 환불 (24h+ 남음 · ${Math.floor(hoursUntil)}h)`,
        }
      : hoursUntil >= 12
        ? {
            tone: "warn" as const,
            text: `취소 시 50% 환불 (12-24h · ${Math.floor(hoursUntil)}h 남음)`,
          }
        : {
            tone: "danger" as const,
            text: `취소 시 환불 불가 (12h 미만 · ${Math.max(0, Math.floor(hoursUntil))}h 남음)`,
          };
  const bandStyle = cancellationBand
    ? {
        ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warn: "border-amber-200 bg-amber-50 text-amber-700",
        danger: "border-rose-200 bg-rose-50 text-rose-700",
      }[cancellationBand.tone]
    : "";

  return (
    <div className="max-w-3xl space-y-8">
      <section
        className={`rounded-lg border bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ring-1 ring-inset ${tone.ring}`}
      >
        <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
          Booking · {booking.id.slice(0, 8).toUpperCase()}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="flex flex-wrap items-baseline gap-2 font-display text-[24px] italic text-hesya-navy-900">
              <span>Booking</span>
              <span className="kr text-[20px] font-bold not-italic">
                예약 상세
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${tone.chip}`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 rounded-full ${tone.dot}`}
                />
                {labels.statuses[currentStatus] ?? currentStatus}
              </span>
              <span className="kr rounded-full bg-hesya-peach-100 px-2.5 py-0.5 text-[11px] font-semibold text-hesya-navy-900/80">
                {serviceLabel}
              </span>
            </div>
            <p className="font-mono text-[11.5px] text-hesya-navy-900/65">
              {formatDate(booking.scheduledAt)} · 디자이너{" "}
              <span className="kr text-hesya-navy-900/85">{staffLabel}</span>
            </p>
          </div>
          {booking.totalPriceKrw ? (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/55">
                {labels.fields.price}
              </p>
              <p className="mt-1 font-mono text-[20px] font-bold tabular-nums text-hesya-navy-900">
                ₩{booking.totalPriceKrw.toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
        {cancellationBand && (
          <div
            className={`mt-4 rounded-md border px-3 py-2 text-[11.5px] font-medium ${bandStyle}`}
          >
            <span aria-hidden="true">
              {cancellationBand.tone === "danger"
                ? "⚠ "
                : cancellationBand.tone === "warn"
                  ? "⏱ "
                  : "✓ "}
            </span>
            {cancellationBand.text}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-baseline gap-2 font-display text-[20px] italic text-hesya-navy-900">
          <span>Booking info</span>
          <span className="kr text-[16px] font-bold not-italic text-hesya-navy-900">
            {labels.headers.info}
          </span>
          <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
            §01 · DETAILS
          </span>
        </h2>
        <div className="flex flex-col gap-2.5">
          <InfoBlock
            label={labels.fields.scheduled}
            value={formatDate(booking.scheduledAt)}
            mono
          />
          <InfoBlock label={labels.fields.service} value={serviceLabel} />
          <InfoBlock label={labels.fields.staff} value={staffLabel} />
          <InfoBlock
            label={labels.fields.price}
            value={
              booking.totalPriceKrw
                ? `₩${booking.totalPriceKrw.toLocaleString()}`
                : "—"
            }
            mono
            highlight={!!booking.totalPriceKrw}
          />
          <InfoBlock
            label={labels.fields.deposit}
            value={
              booking.depositPaidKrw
                ? `₩${booking.depositPaidKrw.toLocaleString()}`
                : "—"
            }
            mono
          />
          <InfoBlock
            label={labels.fields.paymentMethod}
            value={booking.paymentMethod ?? "—"}
          />
          <InfoBlock
            label={labels.fields.status}
            value={labels.statuses[currentStatus] ?? currentStatus}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-baseline gap-2 font-display text-[20px] italic text-hesya-navy-900">
          <span>Actions</span>
          <span className="kr text-[16px] font-bold not-italic text-hesya-navy-900">
            {labels.headers.actions}
          </span>
          <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
            §02 · STATUS
          </span>
        </h2>
        {isTerminal ? (
          <p className="kr break-keep rounded-md bg-hesya-peach-50 px-4 py-3 text-[13px] text-gray-700">
            {labels.actions.terminalNote}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={dispatch("completed")}
              disabled={pending}
              className="kr rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? labels.actions.processing
                : labels.actions.markCompleted}
            </button>
            <button
              type="button"
              onClick={dispatch("no_show")}
              disabled={pending}
              className="kr rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-[13px] font-medium text-hesya-navy-900 transition-colors hover:border-hesya-amber-500 hover:text-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {labels.actions.markNoShow}
            </button>
            <button
              type="button"
              onClick={dispatch("cancelled")}
              disabled={pending}
              className="kr rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-[13px] font-medium text-hesya-navy-900 transition-colors hover:border-hesya-amber-500 hover:text-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {labels.actions.markCancelled}
            </button>
          </div>
        )}
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      </section>
    </div>
  );
}

/**
 * M6.4b — reference `.bk-info-block` 정합 (peach-50 carded + uppercase key + 18px mono val).
 */
function InfoBlock({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md px-3.5 py-3 " +
        (highlight
          ? "border border-hesya-amber-500 bg-hesya-peach-100"
          : "bg-hesya-peach-50")
      }
    >
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-gray-500">
        {label}
      </p>
      <p
        className={
          (mono
            ? "mono text-[18px] font-bold "
            : "kr text-[13px] font-medium ") + "text-hesya-navy-900"
        }
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}
