"use client";

/**
 * Sprint 2C PR-C1 — Owner Bookings 주간 calendar view.
 *
 * Reference: `docs/design/reference/bookings-views.jsx` WeekGrid.
 * 7일 × 14시간 (09:00-22:00) 그리드. 각 예약 카드는 day/start/end로 positioning.
 * 색은 디자이너별 (left border color), 외국인 손님은 flag 표시 + foreign 스타일.
 *
 * Mock-only — 베타 매장 매칭 후 booking DAL에서 (storeId, weekStart) 단위로 fetch.
 * drag-drop 일정 변경은 Phase 1.5 (mock에서는 클릭 → side panel 만).
 */

import { useEffect, useState } from "react";
import type {
  MockBookingCard,
  MockStylist,
} from "@/lib/mock-fixtures/bookings";

const ROW_HEIGHT = 56;

/**
 * Now-line — 오늘 컬럼에 현재 시각 빨간 점 + 라벨 (reference `bk-now-line`).
 * 9:00~22:00 범위 안일 때만 표시. 15초마다 자동 갱신.
 */
function NowLine({ hours }: { hours: ReadonlyArray<number> }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  const cur = now.getHours() + now.getMinutes() / 60;
  const minHour = hours[0]!;
  const maxHour = hours[hours.length - 1]! + 1;
  if (cur < minHour || cur >= maxHour) return null;
  const top = (cur - minHour) * ROW_HEIGHT;
  const label = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10"
      style={{ top: `${top}px` }}
    >
      <div className="relative">
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]" />
        <span className="block h-px bg-red-500/80" />
        <span className="mono absolute right-1 -translate-y-1/2 rounded bg-red-500 px-1 py-px text-[9px] font-semibold text-white">
          {label}
        </span>
      </div>
    </div>
  );
}

export interface WeekCalendarLabels {
  readonly title: string;
  readonly today: string;
  readonly prev: string;
  readonly next: string;
  readonly statusConfirmed: string;
  readonly statusPending: string;
  readonly statusCompleted: string;
  readonly statusNoshow: string;
  readonly filterAll: string;
  readonly filterForeign: string;
  readonly filterConfirmed: string;
  readonly filterPending: string;
  readonly filterNoshow: string;
  readonly minSuffix: string; // "m" or "분"
}

interface Props {
  readonly weekLabel: string;
  readonly days: ReadonlyArray<{
    readonly kr: string;
    readonly en: string;
    readonly num: number;
    readonly today?: boolean;
  }>;
  readonly hours: ReadonlyArray<number>;
  readonly bookings: ReadonlyArray<MockBookingCard>;
  readonly stylists: ReadonlyArray<MockStylist>;
  readonly counts: {
    readonly all: number;
    readonly foreign: number;
    readonly confirmed: number;
    readonly pending: number;
    readonly noshow: number;
  };
  readonly labels: WeekCalendarLabels;
  readonly onSelectBooking: (b: MockBookingCard) => void;
  readonly selectedId: number | null;
}

type FilterKey = "all" | "foreign" | "confirmed" | "pending" | "noshow";

export function WeekCalendarView({
  weekLabel,
  days,
  hours,
  bookings,
  stylists,
  counts,
  labels,
  onSelectBooking,
  selectedId,
}: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "foreign") return b.foreign;
    return b.status === filter;
  });

  const stylistById = (id: string) =>
    stylists.find((s) => s.id === id) ?? stylists[0]!;

  const fmtTime = (t: number): string => {
    const h = Math.floor(t).toString().padStart(2, "0");
    const m = ((t % 1) * 60 || 0).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const FILTERS: ReadonlyArray<{ key: FilterKey; label: string; n: number }> = [
    { key: "all", label: labels.filterAll, n: counts.all },
    { key: "foreign", label: labels.filterForeign, n: counts.foreign },
    { key: "confirmed", label: labels.filterConfirmed, n: counts.confirmed },
    { key: "pending", label: labels.filterPending, n: counts.pending },
    { key: "noshow", label: labels.filterNoshow, n: counts.noshow },
  ];

  return (
    <div className="space-y-4">
      {/* Week nav + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-hesya-navy-900/10">
          <button
            type="button"
            aria-label={labels.prev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-hesya-navy-900/55 transition hover:bg-hesya-peach-100"
          >
            ‹
          </button>
          <span className="font-mono text-[12.5px] font-medium text-hesya-navy-900">
            {weekLabel}
          </span>
          <button
            type="button"
            aria-label={labels.next}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-hesya-navy-900/55 transition hover:bg-hesya-peach-100"
          >
            ›
          </button>
          <span className="ml-1 inline-flex items-center rounded-full bg-hesya-amber-500 px-2 py-0.5 text-[10.5px] font-semibold text-white shadow-[0_2px_6px_rgba(232,169,122,0.35)]">
            {labels.today}
          </span>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          data-testid="bookings-filter-row"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition ${
                filter === f.key
                  ? "bg-hesya-navy-900 text-hesya-peach-50"
                  : "bg-white text-hesya-navy-900/70 ring-1 ring-hesya-navy-900/10 hover:bg-hesya-peach-100"
              }`}
            >
              {f.label}
              <span
                className={`font-mono text-[10.5px] ${
                  filter === f.key
                    ? "text-hesya-peach-50/70"
                    : "text-hesya-navy-900/45"
                }`}
              >
                {f.n}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div
        data-testid="bookings-calendar-grid"
        className="overflow-x-auto rounded-2xl bg-white ring-1 ring-hesya-navy-900/10"
      >
        <div className="min-w-[860px]">
          {/* Day headers */}
          <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-hesya-navy-900/10">
            <div aria-hidden="true" />
            {days.map((d, dayIdx) => {
              const dayCount = filtered.filter((b) => b.day === dayIdx).length;
              return (
                <div
                  key={d.en}
                  className={`flex flex-col items-center justify-center gap-0.5 border-l border-hesya-navy-900/5 py-3 ${
                    d.today ? "bg-hesya-peach-100/50" : ""
                  }`}
                >
                  <span
                    className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
                      d.today
                        ? "text-hesya-amber-600"
                        : "text-hesya-navy-900/45"
                    }`}
                  >
                    {d.kr} · {d.en}
                  </span>
                  <span
                    className={`font-mono text-[16px] font-semibold ${
                      d.today ? "text-hesya-amber-600" : "text-hesya-navy-900"
                    }`}
                  >
                    {d.num.toString().padStart(2, "0")}
                  </span>
                  <span
                    aria-label={`${d.kr} 예약 ${dayCount}건`}
                    className={`mt-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px font-mono text-[9.5px] font-semibold tabular-nums ${
                      dayCount === 0
                        ? "bg-hesya-peach-50 text-hesya-navy-900/35"
                        : d.today
                          ? "bg-hesya-amber-500 text-white"
                          : "bg-hesya-navy-900/10 text-hesya-navy-900/75"
                    }`}
                  >
                    {dayCount}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[64px_repeat(7,1fr)]">
            {/* Time column */}
            <div className="border-r border-hesya-navy-900/5">
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className="flex items-start justify-end pr-2 pt-1 font-mono text-[10.5px] text-hesya-navy-900/45"
                >
                  {h.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, dayIdx) => (
              <div
                key={d.en}
                className={`relative border-l border-hesya-navy-900/5 ${
                  d.today ? "bg-hesya-peach-50/30" : ""
                }`}
                style={{ height: `${hours.length * ROW_HEIGHT}px` }}
              >
                {/* Hour lines */}
                {hours.map((_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="absolute inset-x-0 border-b border-hesya-navy-900/5"
                    style={{ top: `${i * ROW_HEIGHT}px`, height: 1 }}
                  />
                ))}
                {/* Now-line (reference bk-now-line) — 오늘 컬럼만, 9-22h 안일 때 표시 */}
                {d.today && <NowLine hours={hours} />}
                {/* Bookings */}
                {filtered
                  .filter((b) => b.day === dayIdx)
                  .map((b) => {
                    const stylist = stylistById(b.stylistId);
                    const top = (b.start - 9) * ROW_HEIGHT;
                    const height = (b.end - b.start) * ROW_HEIGHT - 4;
                    const dur = Math.round((b.end - b.start) * 60);
                    const selected = selectedId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onSelectBooking(b)}
                        className={`absolute left-1 right-1 flex flex-col items-stretch overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left transition ${
                          b.foreign
                            ? "bg-gradient-to-br from-hesya-peach-100 to-hesya-amber-200/80"
                            : "bg-hesya-navy-900/5"
                        } ${
                          b.status === "noshow"
                            ? "opacity-50"
                            : b.status === "completed"
                              ? "opacity-80"
                              : ""
                        } ${
                          selected
                            ? "ring-2 ring-hesya-amber-500 ring-offset-1"
                            : "hover:ring-1 hover:ring-hesya-amber-600/40"
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          borderLeftColor: stylist.color,
                        }}
                      >
                        {b.foreign && (
                          <span
                            aria-hidden="true"
                            className="absolute right-1 top-1 text-[10px]"
                          >
                            {b.flag}
                          </span>
                        )}
                        {b.vip && (
                          <span
                            aria-hidden="true"
                            className="absolute left-1 top-1 text-[8px] text-hesya-amber-600"
                          >
                            ★
                          </span>
                        )}
                        {b.status === "pending" && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 right-0 w-[3px] bg-amber-400/60"
                          />
                        )}
                        {b.status === "completed" && (
                          <span
                            aria-hidden="true"
                            className="absolute right-0.5 top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white"
                          >
                            ✓
                          </span>
                        )}
                        <span className="truncate font-mono text-[9.5px] font-semibold text-hesya-navy-900/70">
                          {fmtTime(b.start)} · {dur}
                          {labels.minSuffix}
                        </span>
                        <span className="truncate text-[11px] font-semibold text-hesya-navy-900">
                          {b.kr}
                        </span>
                        {height > 32 && (
                          <span className="truncate text-[10px] text-hesya-navy-900/65">
                            {b.service}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
