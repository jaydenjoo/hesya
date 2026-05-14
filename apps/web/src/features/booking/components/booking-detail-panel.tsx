"use client";

/**
 * Sprint 2C PR-C1 — Booking side panel (mock 시연용).
 *
 * Reference: `docs/design/reference/bookings-app.jsx` SidePanel.
 * 선택된 예약의 상세 + actions (확정/알림/일정변경/취소/노쇼/태그/.ics).
 *
 * Mock 단계 — 액션은 console.log/alert만 (실 booking action은 Phase 1.5).
 */

import type {
  MockBookingCard,
  MockStylist,
} from "@/lib/mock-fixtures/bookings";

export interface BookingDetailLabels {
  readonly close: string;
  readonly minSuffix: string;
  readonly vipBadge: string;
  readonly confirm: string;
  readonly notify: string;
  readonly reschedule: string;
  readonly cancel: string;
  readonly markNoshow: string;
  readonly tag: string;
  readonly exportIcs: string;
  readonly statusLabel: string;
  readonly statusConfirmed: string;
  readonly statusPending: string;
  readonly statusCompleted: string;
  readonly statusNoshow: string;
  readonly customerLabel: string;
  readonly serviceLabel: string;
  readonly stylistLabel: string;
  readonly paidLabel: string;
  readonly refundLabel: string;
  /** "24시간 전 환불 100% / 12시간 전 50% / 미만 0%" 같은 정책. */
  readonly refundHint: string;
}

interface Props {
  readonly booking: MockBookingCard | null;
  readonly stylists: ReadonlyArray<MockStylist>;
  readonly day: string;
  readonly labels: BookingDetailLabels;
  readonly onClose: () => void;
}

export function BookingDetailPanel({
  booking,
  stylists,
  day,
  labels,
  onClose,
}: Props) {
  if (!booking) return null;
  const stylist =
    stylists.find((s) => s.id === booking.stylistId) ?? stylists[0]!;
  const fmtTime = (t: number) => {
    const h = Math.floor(t).toString().padStart(2, "0");
    const m = ((t % 1) * 60 || 0).toString().padStart(2, "0");
    return `${h}:${m}`;
  };
  const dur = Math.round((booking.end - booking.start) * 60);
  const statusLabel = {
    confirmed: labels.statusConfirmed,
    pending: labels.statusPending,
    completed: labels.statusCompleted,
    noshow: labels.statusNoshow,
  }[booking.status];

  // Refund preview — 24h+ 100%, 12h+ 50%, <12h 0%. mock에서는 24h 가정.
  const hoursUntil = 24;
  const refundPct = hoursUntil >= 24 ? 100 : hoursUntil >= 12 ? 50 : 0;
  const refundAmount = Math.round((booking.paid * refundPct) / 100);

  return (
    <aside
      data-testid="bookings-detail-panel"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-hesya-navy-900/10 bg-white shadow-2xl lg:relative lg:max-w-none"
    >
      <header className="sticky top-0 z-10 flex items-start gap-2 border-b border-hesya-navy-900/10 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-[20px]">
              {booking.flag}
            </span>
            <h2 className="truncate font-heading text-[18px] font-semibold italic text-hesya-navy-900">
              {booking.kr}
            </h2>
            {booking.vip && (
              <span className="inline-flex items-center rounded-full bg-hesya-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                ★ {labels.vipBadge}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[12px] text-hesya-navy-900/55">
            {fmtTime(booking.start)} – {fmtTime(booking.end)} · {dur}
            {labels.minSuffix} · {day}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-hesya-navy-900/55 transition hover:bg-hesya-peach-100"
        >
          ×
        </button>
      </header>

      <div className="space-y-5 px-5 py-5">
        {/* Primary actions */}
        <div className="space-y-2">
          {booking.status === "pending" && (
            <button
              type="button"
              onClick={() => alert(labels.confirm)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-hesya-navy-900 px-4 py-3 text-[14px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90"
            >
              <span aria-hidden="true">✓</span>
              {labels.confirm}
            </button>
          )}
          {booking.status === "confirmed" && (
            <button
              type="button"
              onClick={() => alert(labels.notify)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-hesya-amber-500 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-hesya-amber-600"
            >
              <span aria-hidden="true">📤</span>
              {labels.notify}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => alert(labels.reschedule)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-hesya-peach-100 px-3 py-2.5 text-[12.5px] font-medium text-hesya-navy-900 transition hover:bg-hesya-peach-200"
            >
              🗓 {labels.reschedule}
            </button>
            <button
              type="button"
              onClick={() => alert(labels.cancel)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-hesya-peach-100 px-3 py-2.5 text-[12.5px] font-medium text-hesya-navy-900 transition hover:bg-hesya-peach-200"
            >
              × {labels.cancel}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => alert(labels.markNoshow)}
              className="rounded-lg bg-hesya-navy-900/5 px-2 py-1.5 text-[11px] font-medium text-hesya-navy-900/70 transition hover:bg-hesya-navy-900/10"
            >
              {labels.markNoshow}
            </button>
            <button
              type="button"
              onClick={() => alert(labels.tag)}
              className="rounded-lg bg-hesya-navy-900/5 px-2 py-1.5 text-[11px] font-medium text-hesya-navy-900/70 transition hover:bg-hesya-navy-900/10"
            >
              {labels.tag}
            </button>
            <button
              type="button"
              onClick={() => alert(labels.exportIcs)}
              className="rounded-lg bg-hesya-navy-900/5 px-2 py-1.5 text-[11px] font-medium text-hesya-navy-900/70 transition hover:bg-hesya-navy-900/10"
            >
              {labels.exportIcs}
            </button>
          </div>
        </div>

        {/* Info table */}
        <dl className="space-y-2.5 rounded-xl bg-hesya-peach-50/60 p-4 ring-1 ring-hesya-navy-900/5">
          <Row label={labels.statusLabel} value={statusLabel} />
          <Row label={labels.customerLabel} value={booking.customer} />
          <Row label={labels.serviceLabel} value={booking.service} />
          <Row
            label={labels.stylistLabel}
            value={stylist.name}
            valueColor={stylist.color}
          />
          <Row
            label={labels.paidLabel}
            value={`₩${booking.paid.toLocaleString("ko")}`}
            valueClass="font-mono font-semibold"
          />
        </dl>

        {/* Refund preview */}
        <section className="rounded-xl bg-hesya-peach-100/60 p-4 ring-1 ring-hesya-amber-600/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-hesya-amber-600">
            {labels.refundLabel}
          </p>
          <p className="mt-1.5 font-heading text-[18px] font-semibold italic text-hesya-navy-900">
            ₩{refundAmount.toLocaleString("ko")}{" "}
            <span className="text-[12px] font-normal text-hesya-navy-900/55">
              ({refundPct}%)
            </span>
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-hesya-navy-900/55 [word-break:keep-all]">
            {labels.refundHint}
          </p>
        </section>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  valueColor,
  valueClass,
}: {
  label: string;
  value: string;
  valueColor?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-hesya-navy-900/45">
        {label}
      </dt>
      <dd
        className={`text-right text-[13px] text-hesya-navy-900 ${valueClass ?? ""}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
