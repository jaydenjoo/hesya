"use client";

/**
 * C3 PR 15 — Story Share 카드. Reference: booking-app.jsx `.story-share`.
 *
 * 9:16 Instagram Story 형식 카드 + Save/DM/Copy 3 액션. 외국인 손님 자발 공유로
 * SNS 노출 확장 — Phase 1.5 베타 매장 매칭 후 actual 공유 핸들러 연결 예정.
 *
 * 현재는 mock — 액션 클릭 시 alert (베타에서 toast로 교체).
 */

interface Props {
  readonly title: string;
  readonly subtitle: string;
  readonly brandLabel: string;
  readonly customerName: string;
  readonly serviceText: string;
  readonly dateText: string;
  readonly locationText: string;
  readonly handle: string;
  readonly tagLine: string;
  readonly actions: {
    readonly save: string;
    readonly send: string;
    readonly copy: string;
  };
}

function HandBowSmall() {
  return (
    <svg
      width="60"
      height="50"
      viewBox="0 0 60 50"
      aria-hidden="true"
      fill="none"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      >
        <circle cx="30" cy="14" r="6" />
        <path d="M22 36 Q24 24 30 20 L30 20 Q36 24 38 36" />
        <path d="M25 30 Q30 33 35 30" />
        <path d="M10 12 v4 M8 14 h4" />
        <path d="M50 22 v3 M48.5 23.5 h3" />
      </g>
    </svg>
  );
}

export function StoryShareCard({
  title,
  subtitle,
  brandLabel,
  customerName,
  serviceText,
  dateText,
  locationText,
  handle,
  tagLine,
  actions,
}: Props) {
  return (
    <section className="rounded-2xl bg-white px-5 py-5 shadow-[0_4px_16px_rgba(26,34,56,0.06)]">
      <h3 className="font-heading text-[18px] font-medium italic text-hesya-navy-900 [word-break:keep-all]">
        {title}
      </h3>
      <p className="mt-1 text-[11.5px] text-hesya-navy-900/55 [word-break:keep-all]">
        {subtitle}
      </p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="relative w-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-hesya-peach-200 via-hesya-peach-100 to-hesya-amber-200 px-4 py-5 text-hesya-navy-900 shadow-[0_8px_24px_rgba(216,139,91,0.18)] aspect-[9/16]">
          <div className="flex items-center justify-center text-hesya-amber-600">
            <HandBowSmall />
          </div>
          <div className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            {brandLabel}
          </div>
          <div className="mt-1 text-center font-heading text-[18px] font-semibold italic">
            {customerName}
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-hesya-navy-900/80">
            <p>✂️ {serviceText}</p>
            <p>📅 {dateText}</p>
            <p>📍 {locationText}</p>
          </div>
          <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
            <div
              aria-hidden="true"
              className="h-6 w-6 rounded bg-hesya-navy-900/85"
            />
            <p className="kr text-right text-[8.5px] leading-tight text-hesya-navy-900/70 [word-break:keep-all]">
              {tagLine}
            </p>
          </div>
          <div className="absolute bottom-1 right-2 text-[8px] text-hesya-navy-900/50">
            {handle}
          </div>
        </div>
        <div className="flex w-full flex-row gap-1.5">
          <ActionButton primary icon="📷" label={actions.save} />
          <ActionButton icon="💬" label={actions.send} />
          <ActionButton icon="🔗" label={actions.copy} />
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  primary,
  icon,
  label,
}: {
  primary?: boolean;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className={
        primary
          ? "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-hesya-amber-500 px-3 py-2 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(232,169,122,0.35)] transition hover:bg-hesya-amber-600"
          : "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 transition hover:bg-hesya-peach-50"
      }
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
