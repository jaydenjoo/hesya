import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 3 — W2 이번 주 외국인 매출 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:200-222` `TileGMV`.
 * 큰 mono 숫자 + 전주 대비 delta pill + 7-bar chart (월~일).
 *
 * **mock-first**: 실 DAL은 `getWeeklyGmvByForeigners(storeId)` 신규 (월~일 7-row
 * 외국인 분기 집계) — 별도 task. 본 컴포넌트는 page.tsx에서 props로 mock 주입.
 */

interface Props {
  /** 이번 주 외국인 매출 합계 (KRW) */
  readonly amountKrw: number;
  /** 전주 대비 변화율 (%, 양수 = 증가) */
  readonly deltaPct: number;
  /** 월~일 7-bar 높이 (0~100). length === 7 보장 */
  readonly weekHeights: ReadonlyArray<number>;
  /** number formatting locale (page.tsx에서 주입) */
  readonly locale: string;
}

const DAY_KEYS = [
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
  "daySun",
] as const;

export function WeeklyGmv({ amountKrw, deltaPct, weekHeights, locale }: Props) {
  const t = useTranslations("Dashboard.weeklyGmv");
  const isPositive = deltaPct >= 0;
  const formattedAmount = amountKrw.toLocaleString(locale);

  return (
    <section
      data-testid="dashboard-weekly-gmv"
      aria-label={t("title")}
      className="rounded-lg border border-hesya-peach-200 bg-white p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
      </header>

      <div className="mb-3 flex items-baseline gap-1 mono">
        <span className="text-[14px] text-gray-500">{t("currency")}</span>
        <span className="text-[28px] font-bold tabular-nums text-hesya-navy-900">
          {formattedAmount}
        </span>
      </div>

      <div
        data-testid="dashboard-weekly-gmv-pill"
        className={
          "kr mb-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium " +
          (isPositive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700")
        }
      >
        <span aria-hidden="true">{isPositive ? "↑" : "↓"}</span>
        {t(isPositive ? "deltaPositive" : "deltaNegative", {
          pct: Math.abs(deltaPct),
        })}
      </div>

      <div
        className="flex h-24 items-end gap-1.5"
        role="img"
        aria-label={t("chartAria", { count: weekHeights.length })}
      >
        {weekHeights.map((h, i) => (
          <div
            key={DAY_KEYS[i]}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div
              className="w-full rounded-t bg-hesya-amber-500 transition-all"
              style={{ height: `${Math.max(4, Math.min(100, h))}%` }}
              aria-hidden="true"
            />
            <span className="kr text-[10px] text-gray-500">
              {t(DAY_KEYS[i] ?? "dayMon")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
