"use client";

/**
 * Sprint 2C PR-C1 — Bookings view switcher (Calendar / List).
 *
 * Reference: `docs/design/reference/bookings-views.jsx` HeaderStrip view-toggle.
 * 기존 BookingsList는 List view로 유지, Calendar view 신규 추가.
 *
 * Calendar view = mock fixture 기반 (MOCK_FIXTURES=true 시 page.tsx에서 props 주입).
 * 실 DB booking은 still List view에서 렌더 (week 기반 변환 필요 — Phase 1.5).
 */

import { useState } from "react";
import type {
  MockBookingCard,
  MockStylist,
} from "@/lib/mock-fixtures/bookings";
import { BookingDetailPanel } from "./booking-detail-panel";
import {
  WeekCalendarView,
  type WeekCalendarLabels,
} from "./week-calendar-view";
import type { BookingDetailLabels } from "./booking-detail-panel";

export interface ViewSwitcherLabels {
  readonly tabCalendar: string;
  readonly tabList: string;
  readonly newBooking: string;
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
  readonly mockBookings: ReadonlyArray<MockBookingCard>;
  readonly stylists: ReadonlyArray<MockStylist>;
  readonly counts: {
    readonly all: number;
    readonly foreign: number;
    readonly confirmed: number;
    readonly pending: number;
    readonly noshow: number;
  };
  readonly switcherLabels: ViewSwitcherLabels;
  readonly weekLabels: WeekCalendarLabels;
  readonly detailLabels: BookingDetailLabels;
  /** Existing BookingsList component to render in List view tab (real DB rows). */
  readonly listChildren: React.ReactNode;
}

export function BookingsViewSwitcher({
  weekLabel,
  days,
  hours,
  mockBookings,
  stylists,
  counts,
  switcherLabels,
  weekLabels,
  detailLabels,
  listChildren,
}: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState<MockBookingCard | null>(null);

  // 선택된 예약의 day → days 배열에서 표시용 라벨.
  const selectedDayLabel = selected
    ? `04.${days[selected.day]!.num.toString().padStart(2, "0")} (${days[selected.day]!.kr})`
    : "";

  return (
    <div className="relative">
      {/* View toggle + new booking */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-hesya-navy-900/10"
          data-testid="bookings-view-toggle"
        >
          {[
            {
              key: "calendar" as const,
              label: switcherLabels.tabCalendar,
              icon: "📅",
            },
            { key: "list" as const, label: switcherLabels.tabList, icon: "📋" },
          ].map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                view === v.key
                  ? "bg-hesya-navy-900 text-hesya-peach-50"
                  : "text-hesya-navy-900/55 hover:text-hesya-navy-900"
              }`}
            >
              <span aria-hidden="true">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-hesya-amber-500 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_10px_rgba(232,169,122,0.35)] transition hover:bg-hesya-amber-600"
        >
          <span aria-hidden="true">+</span>
          {switcherLabels.newBooking}
          <span
            aria-hidden="true"
            className="ml-1 inline-flex items-center gap-0.5"
          >
            <kbd className="mono rounded bg-white/20 px-1 py-px text-[9px] font-medium leading-none">
              ⌘
            </kbd>
            <kbd className="mono rounded bg-white/20 px-1 py-px text-[9px] font-medium leading-none">
              N
            </kbd>
          </span>
        </button>
      </div>

      {view === "calendar" ? (
        <WeekCalendarView
          weekLabel={weekLabel}
          days={days}
          hours={hours}
          bookings={mockBookings}
          stylists={stylists}
          counts={counts}
          labels={weekLabels}
          selectedId={selected?.id ?? null}
          onSelectBooking={setSelected}
        />
      ) : (
        <div>{listChildren}</div>
      )}

      {selected && (
        <BookingDetailPanel
          booking={selected}
          stylists={stylists}
          day={selectedDayLabel}
          labels={detailLabels}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
