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
    <div className="max-w-2xl space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-hesya-navy-900">
          {labels.headers.info}
        </h2>
        <dl className="rounded-md border border-hesya-peach-100 bg-white p-4 text-sm">
          <Row
            k={labels.fields.scheduled}
            v={formatDate(booking.scheduledAt)}
          />
          <Row k={labels.fields.service} v={serviceLabel} />
          <Row k={labels.fields.staff} v={staffLabel} />
          <Row
            k={labels.fields.price}
            v={
              booking.totalPriceKrw
                ? `₩${booking.totalPriceKrw.toLocaleString()}`
                : "—"
            }
          />
          <Row
            k={labels.fields.deposit}
            v={
              booking.depositPaidKrw
                ? `₩${booking.depositPaidKrw.toLocaleString()}`
                : "—"
            }
          />
          <Row
            k={labels.fields.paymentMethod}
            v={booking.paymentMethod ?? "—"}
          />
          <Row
            k={labels.fields.status}
            v={labels.statuses[currentStatus] ?? currentStatus}
          />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-hesya-navy-900">
          {labels.headers.actions}
        </h2>
        {isTerminal ? (
          <p className="text-sm text-hesya-navy-900/70">
            {labels.actions.terminalNote}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={dispatch("completed")}
              disabled={pending}
              className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-40"
            >
              {pending
                ? labels.actions.processing
                : labels.actions.markCompleted}
            </button>
            <button
              type="button"
              onClick={dispatch("no_show")}
              disabled={pending}
              className="rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-hesya-navy-900 transition-colors hover:border-hesya-navy-900 disabled:opacity-40"
            >
              {labels.actions.markNoShow}
            </button>
            <button
              type="button"
              onClick={dispatch("cancelled")}
              disabled={pending}
              className="rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-hesya-navy-900 transition-colors hover:border-hesya-navy-900 disabled:opacity-40"
            >
              {labels.actions.markCancelled}
            </button>
          </div>
        )}
        {errorMsg && <p className="text-sm text-red-700">{errorMsg}</p>}
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-32 font-medium text-hesya-navy-900">{k}</dt>
      <dd className="text-hesya-navy-900/80">{v}</dd>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}
