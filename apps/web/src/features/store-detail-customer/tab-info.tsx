/**
 * Plan v3 Phase D2-B2-b — Tab: 매장 정보 panel.
 *
 * 영업시간 7일 표 + 주소 + K-Verified 상세. 영업시간 null이면 "10:00–20:00
 * 기본값". 외국인 손님 시각의 "이 매장 진짜 운영하나?" 확인 surface.
 */

import type { BusinessHours } from "@hesya/database";
import { KVerifiedBadge } from "@/features/customer-frame/badges/k-verified-badge";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];

function todayDayKey(): Day {
  // Asia/Seoul 기준 — 매장 운영 시간 표는 한국 시간대.
  const seoul = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat → DAYS 순서로 매핑.
  const map: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[seoul.getDay()] ?? "mon";
}

interface Props {
  readonly hours: BusinessHours | null;
  readonly hoursTitle: string;
  readonly hoursFallback: string;
  readonly closedLabel: string;
  readonly addressTitle: string;
  readonly addressText: string | null;
  readonly addressFallback: string;
  readonly verificationTitle: string;
  readonly verificationBody: string;
  readonly kVerifiedShort: string;
  readonly dayLabels: Readonly<Record<Day, string>>;
  readonly phone?: string | null;
  /** Optional override labels — fall back to English (matches reference). */
  readonly mapTapHint?: string;
  readonly phoneTitle?: string;
  readonly phoneLangNote?: string;
  readonly accessibilityTitle?: string;
  readonly accessibilityBody?: string;
}

export function TabInfo({
  hours,
  hoursTitle,
  hoursFallback,
  closedLabel,
  addressTitle,
  addressText,
  addressFallback,
  verificationTitle,
  verificationBody,
  kVerifiedShort,
  dayLabels,
  phone,
  mapTapHint,
  phoneTitle,
  phoneLangNote,
  accessibilityTitle,
  accessibilityBody,
}: Props) {
  const openDayCount = hours
    ? DAYS.reduce((s, d) => s + (hours[d] ? 1 : 0), 0)
    : 0;
  const today = todayDayKey();
  const displayAddress = addressText ?? addressFallback;
  return (
    <div className="space-y-4 px-5 py-4">
      {/* Reference detail-app.jsx L521-527 + detail.css L945-979 — .map-prev box */}
      <div
        aria-hidden="true"
        className="relative grid h-[160px] place-items-center overflow-hidden rounded-2xl"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #e8e2d5, #d4ccb8), repeating-linear-gradient(0deg, rgba(26,34,56,0.06) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(26,34,56,0.06) 0 1px, transparent 1px 24px)",
          backgroundBlendMode: "normal, multiply, multiply",
        }}
      >
        <span className="text-[32px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
          📍
        </span>
        <span className="absolute bottom-3 left-1/2 inline-flex max-w-[80%] -translate-x-1/2 items-center gap-1.5 truncate rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-hesya-navy-900 shadow-[0_2px_8px_rgba(26,34,56,0.12)]">
          <span className="truncate">{displayAddress}</span>
          {mapTapHint && (
            <span className="text-hesya-navy-900/55"> · {mapTapHint}</span>
          )}
        </span>
      </div>

      <section className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            <span aria-hidden="true">⏱</span>
            {hoursTitle}
          </p>
          {hours && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {openDayCount}/7
            </span>
          )}
        </div>
        {hours ? (
          <ul className="space-y-1.5">
            {DAYS.map((d) => {
              const v = hours[d];
              const isToday = d === today;
              return (
                <li
                  key={d}
                  className={`flex items-center justify-between text-[13px] ${isToday ? "font-semibold text-hesya-amber-600" : ""}`}
                >
                  <span
                    className={
                      isToday
                        ? "text-hesya-amber-600"
                        : "text-hesya-navy-900/70"
                    }
                  >
                    {dayLabels[d]}
                    {isToday && (
                      <span
                        aria-hidden="true"
                        className="ml-1 text-[10px] font-mono uppercase tracking-[0.06em] text-hesya-amber-600/80"
                      >
                        · today
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      isToday
                        ? "font-mono text-hesya-amber-600"
                        : v
                          ? "font-mono text-hesya-navy-900"
                          : "text-hesya-navy-900/40"
                    }
                  >
                    {v ? `${v.open}–${v.close}` : closedLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-hesya-navy-900/70">{hoursFallback}</p>
        )}
      </section>

      <section className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-4">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
          <span aria-hidden="true">📍</span>
          {addressTitle}
        </p>
        <p className="text-[13px] leading-relaxed text-hesya-navy-900">
          {addressText ?? addressFallback}
        </p>
      </section>

      <section className="rounded-2xl border border-hesya-peach-200 bg-hesya-peach-50/40 px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <KVerifiedBadge label={kVerifiedShort} size="md" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {verificationTitle}
          </p>
        </div>
        <p className="text-[12px] leading-relaxed text-hesya-navy-900/75">
          {verificationBody}
        </p>
      </section>

      {/* Reference detail-app.jsx L555-561 — .info-row Phone */}
      {phone && (
        <div className="flex items-start gap-3 px-1">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-hesya-peach-100 text-[16px]"
          >
            📞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
              {phoneTitle ?? "Phone"}
            </p>
            <p className="mt-0.5 font-mono text-[13px] text-hesya-navy-900">
              {phone}
            </p>
            {phoneLangNote && (
              <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
                {phoneLangNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reference detail-app.jsx L562-571 — .info-row Accessibility */}
      <div className="flex items-start gap-3 px-1">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-hesya-peach-100 text-[16px]"
        >
          ♿
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {accessibilityTitle ?? "Accessibility"}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-hesya-navy-900/75">
            {accessibilityBody ??
              "Step-free entrance · Elevator access · Wheelchair-friendly chairs available."}
          </p>
        </div>
      </div>
    </div>
  );
}
