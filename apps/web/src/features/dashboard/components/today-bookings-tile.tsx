import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 5a — W1 오늘의 외국인 예약 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:148-198` `TileBookings`.
 * 큰 숫자 + mini avatar flag stack + 다음 시술 라벨 + 12-bar sparkline + 시간 axis.
 *
 * **mock-first**: page에서 mock count + flag stack + sparkline 주입.
 * 실 DAL: `getTodayBookingsByForeigners(storeId)` 신규 (오늘 0~21시 시간대별
 * 집계 + nationality flag 매핑) — 별도 task.
 */

interface FlagAvatar {
  readonly flag: string;
  /** Tailwind bg class (e.g., "bg-hesya-peach-200") */
  readonly bgClass: string;
}

interface Props {
  /** 오늘 외국인 예약 총수 */
  readonly count: number;
  /** mini avatar flag stack (앞 3~4개) */
  readonly avatars: ReadonlyArray<FlagAvatar>;
  /** stack overflow 표시 (e.g., "+4") — null이면 미표시 */
  readonly extraCount: number | null;
  /** 다음 시술 시간 + 손님 이름 (e.g., "14:00 사쿠라님") */
  readonly nextLabel: string;
  /** 12-bar sparkline 높이 (시간대별 booking count). length === 12 보장 */
  readonly sparkHours: ReadonlyArray<number>;
  /** "지금"으로 강조할 bar index (0~11), null이면 강조 없음 */
  readonly nowBarIndex: number | null;
}

export function TodayBookingsTile({
  count,
  avatars,
  extraCount,
  nextLabel,
  sparkHours,
  nowBarIndex,
}: Props) {
  const t = useTranslations("Dashboard.todayBookings");
  const max = Math.max(...sparkHours, 1);

  return (
    <section
      data-testid="dashboard-today-bookings"
      aria-label={t("title")}
      className="rounded-lg border border-hesya-peach-200 bg-white p-5"
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
        <span
          className="kr cursor-not-allowed text-[12px] text-hesya-amber-600"
          title={t("comingSoon")}
          aria-disabled="true"
        >
          {t("viewBookingsLink")} →
        </span>
      </header>

      <div className="mb-4 flex items-center gap-4">
        <div className="mono text-[40px] font-bold leading-none tabular-nums text-hesya-navy-900">
          {count}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center -space-x-2">
            {avatars.map((a, i) => (
              <span
                key={`${a.flag}-${i}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[14px] ${a.bgClass}`}
                aria-hidden="true"
              >
                {a.flag}
              </span>
            ))}
            {extraCount !== null ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-hesya-peach-50 mono text-[10px] font-semibold text-hesya-navy-900">
                +{extraCount}
              </span>
            ) : null}
          </div>
          <div className="kr text-[11px] text-gray-600">
            {t("nextLabel", { value: nextLabel })}
          </div>
        </div>
      </div>

      <div
        className="flex h-14 items-end gap-1"
        role="img"
        aria-label={t("sparkAria", { count: sparkHours.length })}
      >
        {sparkHours.map((v, i) => {
          const heightPct = (v / max) * 100 || 6;
          const isNow = nowBarIndex === i;
          return (
            <div
              key={i}
              className={
                "w-full rounded-t " +
                (isNow ? "bg-hesya-amber-500" : "bg-hesya-peach-200")
              }
              style={{ height: `${heightPct}%` }}
              aria-hidden="true"
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between mono text-[10px] tabular-nums text-gray-500">
        <span>09</span>
        <span>12</span>
        <span className="kr text-hesya-amber-600">{t("nowAxis")}</span>
        <span>17</span>
        <span>21</span>
      </div>
    </section>
  );
}
