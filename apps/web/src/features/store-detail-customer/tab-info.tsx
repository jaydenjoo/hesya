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
}: Props) {
  const openDayCount = hours
    ? DAYS.reduce((s, d) => s + (hours[d] ? 1 : 0), 0)
    : 0;
  return (
    <div className="space-y-4 px-5 py-4">
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
              return (
                <li
                  key={d}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-hesya-navy-900/70">{dayLabels[d]}</span>
                  <span
                    className={
                      v
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
    </div>
  );
}
