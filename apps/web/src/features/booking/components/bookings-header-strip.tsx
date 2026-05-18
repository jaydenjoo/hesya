/**
 * Reference bookings.css L18-99 — `.bk-header` 그리드 + `.bk-title` (22px / 600)
 * + `.bk-week-label` (mono 13px) + `.bk-week-meta` (amber-500 pill) + `+ New`.
 *
 * 비-MOCK 모드(`MOCK_FIXTURES=false`)에서 PageHeader 대신 사용 — week 네비/
 * calendar view 없는 단순 list 위 헤더. 오늘 날짜 + 총 예약 건수를 표시.
 */

import { format } from "date-fns";

interface Props {
  readonly title: string;
  readonly totalCount: number;
  readonly newBookingLabel: string;
  /** Locale for today's date string. */
  readonly locale: string;
}

export function BookingsHeaderStrip({
  title,
  totalCount,
  newBookingLabel,
  locale,
}: Props) {
  const today = new Date();
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
    today,
  );
  const dateLabel = `${format(today, "yyyy.MM.dd")} (${weekday})`;

  return (
    <header
      className="flex items-center gap-4 border-b border-hesya-peach-100 bg-[rgba(253,248,241,0.7)] px-6 py-4 backdrop-blur-sm"
      data-testid="bookings-header-strip"
    >
      <h1 className="font-heading text-[22px] font-semibold leading-none tracking-[-0.01em] text-hesya-navy-900">
        {title}
      </h1>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[13px] font-medium text-hesya-navy-900">
          {dateLabel}
        </span>
        <span className="inline-flex items-center rounded-full bg-hesya-amber-500 px-2 py-0.5 font-mono text-[11px] font-semibold leading-none text-white">
          {totalCount}
        </span>
      </div>
      <div className="flex-1" aria-hidden="true" />
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 rounded-[8px] bg-hesya-amber-500 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(166,113,11,0.2)] transition hover:-translate-y-px hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        title="Phase 1.5 — staff scheduling integration"
      >
        <span aria-hidden="true">+</span>
        {newBookingLabel}
      </button>
    </header>
  );
}
