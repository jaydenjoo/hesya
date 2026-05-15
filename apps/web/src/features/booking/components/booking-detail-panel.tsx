"use client";

/**
 * Sprint 2C PR-C1 + 세션 42 P2 PR #40 — Booking side panel (4-tab mock 시연용).
 *
 * Reference: `docs/design/reference/bookings-app.jsx` SidePanel (4 tabs).
 * Tabs: Info / History / Notes / Risk. Cancel은 inline refund preview.
 *
 * Mock 단계 — 액션은 console.log/alert만 (실 booking action은 Phase 1.5).
 */

import { useState } from "react";

import type {
  MockBookingCard,
  MockBookingNote,
  MockBookingRisk,
  MockStylist,
  MockVisitHistory,
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
  // P2 PR #40 — 4-tab + cancel inline 추가.
  readonly tabInfo?: string;
  readonly tabHistory?: string;
  readonly tabNotes?: string;
  readonly tabRisk?: string;
  readonly cancelConfirmTitle?: string;
  readonly cancelConfirmBody?: string;
  readonly cancelConfirmFee?: string;
  readonly cancelConfirmCta?: string;
  readonly cancelDontCancel?: string;
  readonly hoursUntilLabel?: string;
  readonly infoLangChannelLabel?: string;
  readonly infoNotesLabel?: string;
  readonly infoForeignChannel?: string;
  readonly infoLocalChannel?: string;
  readonly infoSamplePrefs?: string;
  readonly infoCrossInboxLink?: string;
  readonly paymentCompleted?: string;
  readonly paymentNoshowRefunded?: string;
  readonly paymentUnpaid?: string;
  readonly historyTotalLabel?: string;
  readonly historyFirstVisitBadge?: string;
  readonly notesInternalHint?: string;
  readonly notesPlaceholder?: string;
  readonly notesAddButton?: string;
  readonly noNotesYet?: string;
}

interface Props {
  readonly booking: MockBookingCard | null;
  readonly stylists: ReadonlyArray<MockStylist>;
  readonly day: string;
  readonly labels: BookingDetailLabels;
  readonly onClose: () => void;
  readonly history?: ReadonlyArray<MockVisitHistory>;
  readonly notes?: ReadonlyArray<MockBookingNote>;
  readonly risk?: ReadonlyArray<MockBookingRisk>;
}

type Tab = "info" | "history" | "notes" | "risk";

export function BookingDetailPanel({
  booking,
  stylists,
  day,
  labels,
  onClose,
  history = [],
  notes = [],
  risk = [],
}: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  // Refund math — 24h+ 100%, 12h+ 50%, <12h 0%. mock에서는 24h 가정.
  const hoursUntil = 24;
  const refundPct = hoursUntil >= 24 ? 100 : hoursUntil >= 12 ? 50 : 0;
  const refundAmount = Math.round((booking.paid * refundPct) / 100);
  const fee = booking.paid - refundAmount;

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
              onClick={() => setShowCancelConfirm((v) => !v)}
              aria-expanded={showCancelConfirm}
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

        {/* Cancel inline confirm — refund preview */}
        {showCancelConfirm && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-rose-700">
              {labels.cancelConfirmTitle ?? "취소 시 환불 안내"}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-hesya-navy-900/75 [word-break:keep-all]">
              {(
                labels.cancelConfirmBody ??
                "예약까지 {h}시간 남았어요. 매장 정책에 따라 다음과 같이 환불됩니다."
              ).replace("{h}", String(hoursUntil))}
            </p>
            <dl className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-hesya-navy-900/65">{labels.paidLabel}</dt>
                <dd className="font-mono text-hesya-navy-900">
                  ₩{booking.paid.toLocaleString("ko")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-hesya-navy-900/65">
                  {(labels.cancelConfirmFee ?? "취소 수수료 ({pct}%)").replace(
                    "{pct}",
                    String(100 - refundPct),
                  )}
                </dt>
                <dd className="font-mono text-hesya-navy-900/55">
                  −₩{fee.toLocaleString("ko")}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-rose-200 pt-1.5">
                <dt className="font-semibold text-hesya-navy-900">
                  {labels.refundLabel}
                </dt>
                <dd className="font-mono font-semibold text-hesya-navy-900">
                  ₩{refundAmount.toLocaleString("ko")}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-hesya-navy-900/55 [word-break:keep-all]">
              {labels.refundHint}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-hesya-navy-900/75 ring-1 ring-hesya-navy-900/10 transition hover:bg-hesya-peach-50"
              >
                {labels.cancelDontCancel ?? "취소하지 않기"}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(labels.cancel);
                  setShowCancelConfirm(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-rose-700"
              >
                {(labels.cancelConfirmCta ?? "₩{amount} 환불하고 취소").replace(
                  "{amount}",
                  refundAmount.toLocaleString("ko"),
                )}
              </button>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Booking sections"
          className="flex gap-1 border-b border-hesya-peach-200"
        >
          {[
            { id: "info" as const, label: labels.tabInfo ?? "Info" },
            { id: "history" as const, label: labels.tabHistory ?? "History" },
            { id: "notes" as const, label: labels.tabNotes ?? "Notes" },
            { id: "risk" as const, label: labels.tabRisk ?? "Risk" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={
                  "flex-1 border-b-2 px-2 pb-2 pt-1 text-[12px] font-medium transition " +
                  (active
                    ? "border-hesya-amber-500 text-hesya-navy-900"
                    : "border-transparent text-hesya-navy-900/55 hover:text-hesya-navy-900")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "info" && (
          <InfoTab
            booking={booking}
            stylist={stylist}
            labels={labels}
            statusLabel={statusLabel}
          />
        )}
        {tab === "history" && <HistoryTab history={history} labels={labels} />}
        {tab === "notes" && <NotesTab notes={notes} labels={labels} />}
        {tab === "risk" && <RiskTab risk={risk} />}
      </div>
    </aside>
  );
}

function InfoTab({
  booking,
  stylist,
  labels,
  statusLabel,
}: {
  booking: MockBookingCard;
  stylist: MockStylist;
  labels: BookingDetailLabels;
  statusLabel: string;
}) {
  const paymentNote =
    booking.status === "noshow"
      ? (labels.paymentNoshowRefunded ?? "환불 처리됨")
      : booking.paid > 0
        ? (labels.paymentCompleted ?? "✓ 전액 결제 완료 (Stripe)")
        : (labels.paymentUnpaid ?? "미결제");
  const langChannel = booking.foreign
    ? (labels.infoForeignChannel ?? "日本語 · Instagram DM")
    : (labels.infoLocalChannel ?? "한국어 · 전화 예약");
  return (
    <div className="space-y-3">
      <InfoBlock
        keyLabel={labels.serviceLabel}
        value={booking.service}
        sub={
          <>
            {labels.stylistLabel} —{" "}
            <span style={{ color: stylist.color }}>● {stylist.name}</span>
          </>
        }
      />
      <InfoBlock
        keyLabel={labels.paidLabel}
        value={`₩${booking.paid.toLocaleString("ko")}`}
        sub={paymentNote}
        highlight
        mono
      />
      <InfoBlock keyLabel={labels.statusLabel} value={statusLabel} />
      <InfoBlock
        keyLabel={labels.infoLangChannelLabel ?? "언어 / 채널"}
        value={langChannel}
      />
      <InfoBlock
        keyLabel={labels.infoNotesLabel ?? "참고사항"}
        value={
          labels.infoSamplePrefs ?? "두피 민감 · 향이 강한 제품 피해주세요."
        }
      />
      <button
        type="button"
        onClick={() => alert("→ Inbox")}
        className="flex w-full items-center gap-2 rounded-xl bg-hesya-peach-100 px-3 py-2.5 text-[12px] font-medium text-hesya-navy-900 transition hover:bg-hesya-peach-200"
      >
        <span aria-hidden="true">💬</span>
        <span className="flex-1 text-left">
          {labels.infoCrossInboxLink ?? "지난 메시지 보기 → 인박스로"}
        </span>
        <span aria-hidden="true" className="text-hesya-amber-600">
          →
        </span>
      </button>
    </div>
  );
}

function InfoBlock({
  keyLabel,
  value,
  sub,
  highlight,
  mono,
}: {
  keyLabel: string;
  value: string;
  sub?: React.ReactNode;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl p-3 ring-1 " +
        (highlight
          ? "bg-hesya-peach-100/60 ring-hesya-amber-600/20"
          : "bg-hesya-peach-50/60 ring-hesya-navy-900/5")
      }
    >
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-hesya-navy-900/45">
        {keyLabel}
      </p>
      <p
        className={
          "mt-0.5 text-[13.5px] text-hesya-navy-900 " +
          (mono ? "font-mono font-semibold" : "font-medium")
        }
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/65">{sub}</p>
      )}
    </div>
  );
}

function HistoryTab({
  history,
  labels,
}: {
  history: ReadonlyArray<MockVisitHistory>;
  labels: BookingDetailLabels;
}) {
  if (history.length === 0) {
    return (
      <p className="rounded-xl bg-hesya-peach-50/60 px-4 py-6 text-center text-[12px] text-hesya-navy-900/55">
        —
      </p>
    );
  }
  const totalKrw = history.reduce((a, b) => a + b.priceKrw, 0);
  const ratings = history.filter((h) => h.rating != null).map((h) => h.rating!);
  const avg =
    ratings.length === 0
      ? null
      : ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {history.map((h, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl bg-hesya-peach-50/60 px-3 py-2.5 ring-1 ring-hesya-navy-900/5"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-[14px] text-hesya-amber-600 ring-1 ring-hesya-peach-200"
            >
              {h.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[13px] font-semibold italic text-hesya-navy-900">
                {h.title}
              </p>
              <p className="text-[11px] text-hesya-navy-900/55">
                ₩{h.priceKrw.toLocaleString("ko")}
                {h.rating != null && (
                  <>
                    {" · "}
                    <span className="text-hesya-amber-600">★ {h.rating}</span>
                  </>
                )}
                {h.note && (
                  <>
                    {" · "}
                    <span className="text-hesya-amber-600">{h.note}</span>
                  </>
                )}
              </p>
            </div>
            <span className="flex-shrink-0 font-mono text-[10.5px] text-hesya-navy-900/55">
              {h.date}
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-xl bg-hesya-peach-100/60 px-3 py-2 text-center text-[11.5px] font-medium text-hesya-navy-900/75">
        {(labels.historyTotalLabel ?? "총 {n}회 방문 · ₩{total} · 평균 ★ {avg}")
          .replace("{n}", String(history.length))
          .replace("{total}", totalKrw.toLocaleString("ko"))
          .replace("{avg}", avg != null ? avg.toFixed(1) : "—")}
      </p>
    </div>
  );
}

function NotesTab({
  notes,
  labels,
}: {
  notes: ReadonlyArray<MockBookingNote>;
  labels: BookingDetailLabels;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-hesya-navy-900/55 [word-break:keep-all]">
        {labels.notesInternalHint ?? "매장 내부에만 보이는 비공개 메모"}
      </p>
      {notes.length === 0 ? (
        <p className="rounded-xl bg-hesya-peach-50/60 px-4 py-6 text-center text-[12px] text-hesya-navy-900/55">
          {labels.noNotesYet ?? "—"}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li
              key={i}
              className="rounded-xl bg-hesya-peach-50/60 px-3 py-2.5 ring-1 ring-hesya-navy-900/5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-hesya-navy-900/55">
                {n.date} · {n.author}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-hesya-navy-900/80 [word-break:keep-all]">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={labels.notesPlaceholder ?? "새 메모 추가…"}
          rows={3}
          className="w-full rounded-xl border border-hesya-peach-200 bg-white px-3 py-2 text-[12px] text-hesya-navy-900 placeholder:text-hesya-navy-900/35 focus:border-hesya-amber-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => {
            alert(`Saved (mock): ${draft}`);
            setDraft("");
          }}
          className="mt-2 w-full rounded-lg bg-hesya-navy-900 px-3 py-2 text-[12px] font-semibold text-hesya-peach-50 transition disabled:cursor-not-allowed disabled:bg-hesya-navy-900/25"
        >
          {labels.notesAddButton ?? "메모 저장"}
        </button>
      </div>
    </div>
  );
}

function RiskTab({ risk }: { risk: ReadonlyArray<MockBookingRisk> }) {
  if (risk.length === 0) {
    return (
      <p className="rounded-xl bg-hesya-peach-50/60 px-4 py-6 text-center text-[12px] text-hesya-navy-900/55">
        —
      </p>
    );
  }
  const toneCls = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-rose-50 text-rose-700 ring-rose-200",
    neutral: "bg-hesya-peach-50 text-hesya-amber-700 ring-hesya-peach-200",
  } as const;
  return (
    <ul className="space-y-2">
      {risk.map((r, i) => (
        <li
          key={i}
          className={
            "flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 " +
            toneCls[r.tone]
          }
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-white/70 text-[14px]"
          >
            {r.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[13px] font-semibold italic text-hesya-navy-900">
              {r.title}
            </p>
            <p className="mt-0.5 text-[11px] text-hesya-navy-900/65 [word-break:keep-all]">
              {r.meta}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
