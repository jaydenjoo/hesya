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

export function BookingDetail({
  locale,
  booking,
  serviceLabel,
  staffLabel,
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

  return (
    <div className="max-w-3xl space-y-8">
      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            §01 · Info
          </p>
          <h2 className="mt-1.5 font-display text-[20px] italic text-hesya-navy-900">
            {labels.headers.info}
          </h2>
        </div>
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
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            §02 · Actions
          </p>
          <h2 className="mt-1.5 font-display text-[20px] italic text-hesya-navy-900">
            {labels.headers.actions}
          </h2>
        </div>
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
