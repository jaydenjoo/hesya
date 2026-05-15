"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 2 — W7 오늘의 일정 Timeline.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:398-650` `Timeline`.
 * 09~21시 가로 timeline + 2 row track + per-block hover popover + 외국인/내국인 legend.
 *
 * **mock-first**: 9 bookings hardcoded. 실 데이터 wire (bookings DAL × 오늘 날짜 ×
 * staff/customer join × foreign 분기) 별도 task. popover 액션 (상세/메시지/변경)도
 * Stage 1 inbox composer 4 tool 버튼처럼 disabled + "곧 출시" tooltip.
 */

interface TimelineBooking {
  readonly start: number;
  readonly end: number;
  readonly foreign: boolean;
  readonly stylist: string;
  readonly service: string;
  readonly flag: string;
  readonly customer: string;
  readonly row: 0 | 1;
  readonly current?: boolean;
}

const MOCK_BOOKINGS: ReadonlyArray<TimelineBooking> = [
  {
    start: 9.5,
    end: 11,
    foreign: false,
    stylist: "민지",
    service: "커트 + 펌",
    flag: "🇰🇷",
    customer: "김민서",
    row: 0,
  },
  {
    start: 10,
    end: 12,
    foreign: true,
    stylist: "지영",
    service: "K-Beauty 메이크업",
    flag: "🇯🇵",
    customer: "Sakura",
    row: 1,
  },
  {
    start: 12.5,
    end: 14,
    foreign: false,
    stylist: "수진",
    service: "네일 케어",
    flag: "🇰🇷",
    customer: "이지은",
    row: 0,
  },
  {
    start: 13.5,
    end: 15,
    foreign: true,
    stylist: "민지",
    service: "Glow Makeup",
    flag: "🇺🇸",
    customer: "Emma",
    row: 0,
  },
  {
    start: 14,
    end: 16,
    foreign: true,
    stylist: "지영",
    service: "퍼스널 컬러 + 헤어",
    flag: "🇨🇳",
    customer: "Wei",
    row: 1,
    current: true,
  },
  {
    start: 15.5,
    end: 17.5,
    foreign: true,
    stylist: "수진",
    service: "K-Wave 헤어",
    flag: "🇯🇵",
    customer: "Yuki",
    row: 0,
  },
  {
    start: 16.5,
    end: 18,
    foreign: false,
    stylist: "지영",
    service: "드라이 + 트리트먼트",
    flag: "🇰🇷",
    customer: "박서연",
    row: 1,
  },
  {
    start: 18,
    end: 20,
    foreign: true,
    stylist: "민지",
    service: "K-Beauty 풀세트",
    flag: "🇻🇳",
    customer: "Linh",
    row: 0,
  },
  {
    start: 19,
    end: 20.5,
    foreign: true,
    stylist: "지영",
    service: "브라이덜 트라이얼",
    flag: "🇨🇳",
    customer: "Mei",
    row: 1,
  },
];

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;
const START_H = 9;
const SPAN = 12;
const NOW_H = 14.4;
const NOW_LABEL = "14:24";
const LABEL_COL_PX = 72;

const STYLISTS = [
  { name: "지영", dotClass: "bg-hesya-amber-500" },
  { name: "민지", dotClass: "bg-hesya-peach-200" },
  { name: "수진", dotClass: "bg-gray-300" },
] as const;

function formatTime(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h % 1) * 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function TodayTimeline() {
  const t = useTranslations("Dashboard.timeline");
  const [hoverIdx, setHoverIdx] = useState<string | null>(null);

  const nowLeftPct = ((NOW_H - START_H) / SPAN) * 100;

  return (
    <section
      data-testid="dashboard-today-timeline"
      aria-label={t("title")}
      className="mb-4 rounded-lg border border-hesya-peach-200 bg-white p-5"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="kr text-[18px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
          {STYLISTS.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${s.dotClass}`}
              />
              <span className="kr text-gray-700">{s.name}</span>
            </span>
          ))}
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-hesya-peach-200 sm:inline-block"
          />
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-hesya-peach-200"
            />
            <span className="kr text-gray-700">{t("legendForeign")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-gray-300"
            />
            <span className="kr text-gray-700">{t("legendDomestic")}</span>
          </span>
        </div>
      </header>

      <div className="flex">
        <div className="shrink-0" style={{ width: `${LABEL_COL_PX}px` }}>
          <div className="h-5" aria-hidden="true" />
          <div className="kr mb-2 flex h-20 items-center text-[12px] text-gray-600">
            {t("chair1")}
          </div>
          <div className="kr flex h-20 items-center text-[12px] text-gray-600">
            {t("chair2")}
          </div>
        </div>

        <div className="relative flex-1">
          <div className="relative mb-2 h-5">
            {HOURS.map((h, i) => (
              <span
                key={h}
                className="absolute top-0 mono whitespace-nowrap text-[10px] tabular-nums text-gray-500"
                style={{
                  left: `${(i / (HOURS.length - 1)) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-20 h-full w-px bg-red-500"
              style={{ left: `${nowLeftPct}%` }}
            >
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-red-500 px-1.5 py-0.5 mono text-[10px] tabular-nums text-white">
                {t("now", { time: NOW_LABEL })}
              </span>
            </div>

            {[0, 1].map((row) => (
              <div
                key={row}
                className={
                  "relative h-20 rounded-md border border-dashed border-hesya-peach-200 bg-hesya-peach-50/40" +
                  (row === 0 ? " mb-2" : "")
                }
              >
                {MOCK_BOOKINGS.filter((b) => b.row === row).map((b, i) => {
                  const left = ((b.start - START_H) / SPAN) * 100;
                  const width = ((b.end - b.start) / SPAN) * 100;
                  const idx = `${row}-${i}`;
                  const isHover = hoverIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`timeline-block-${idx}`}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                      onFocus={() => setHoverIdx(idx)}
                      onBlur={() => setHoverIdx(null)}
                      className={
                        "absolute top-1.5 bottom-1.5 cursor-default overflow-hidden rounded-md px-2 py-1 text-left transition-shadow " +
                        (b.foreign
                          ? "bg-hesya-peach-100 hover:bg-hesya-peach-200"
                          : "bg-gray-100 hover:bg-gray-200") +
                        (b.current ? " ring-2 ring-hesya-amber-500" : "") +
                        " hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
                      }
                      style={{
                        left: `${left}%`,
                        width: `calc(${width}% - 4px)`,
                      }}
                    >
                      <div className="mono text-[10px] tabular-nums text-gray-700">
                        {formatTime(b.start)}
                      </div>
                      <div className="flex items-center gap-1 text-[12px] leading-tight">
                        <span aria-hidden="true">{b.flag}</span>
                        <span className="kr truncate font-semibold text-hesya-navy-900">
                          {b.customer}
                        </span>
                      </div>
                      <div className="kr truncate text-[10px] text-gray-600">
                        {b.service} · {b.stylist}
                      </div>
                      {isHover ? (
                        <span
                          role="tooltip"
                          className="absolute z-30 w-56 rounded-lg border border-hesya-peach-200 bg-white p-3 text-[12px] shadow-lg"
                          style={{
                            left: "50%",
                            bottom: "calc(100% + 8px)",
                            transform: "translateX(-50%)",
                          }}
                        >
                          <span className="mb-2 flex items-center gap-1.5">
                            <span aria-hidden="true">{b.flag}</span>
                            <strong className="kr text-hesya-navy-900">
                              {b.customer}
                            </strong>
                            <span className="ml-auto mono text-[11px] tabular-nums text-gray-500">
                              {formatTime(b.start)}–{formatTime(b.end)}
                            </span>
                          </span>
                          <span className="kr block text-[11px] text-gray-700">
                            {b.service} · {b.stylist}
                          </span>
                          <span className="mt-2 flex gap-1">
                            <span
                              className="kr cursor-not-allowed rounded border border-hesya-peach-200 px-2 py-1 text-[11px] text-gray-500"
                              title={t("popoverComingSoon")}
                            >
                              {t("popoverDetail")}
                            </span>
                            <span
                              className="kr cursor-not-allowed rounded border border-hesya-peach-200 px-2 py-1 text-[11px] text-gray-500"
                              title={t("popoverComingSoon")}
                            >
                              {t("popoverMessage")}
                            </span>
                            <span
                              className="kr cursor-not-allowed rounded border border-hesya-peach-200 px-2 py-1 text-[11px] text-gray-500"
                              title={t("popoverComingSoon")}
                            >
                              {t("popoverReschedule")}
                            </span>
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
