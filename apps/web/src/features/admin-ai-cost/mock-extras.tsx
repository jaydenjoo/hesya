/**
 * Sprint 2C PR-D1 — Admin AI Cost rich mock 보조 차트.
 *
 * MOCK_FIXTURES=true 일 때만 노출. 4 컴포넌트:
 *   - HourlyHeatmap (7×24 = 168 cells)
 *   - EndpointCostTable (8 endpoints)
 *   - AnomalyAlerts (3 alerts)
 *   - BudgetForecast (MTD + EOM 예측)
 *
 * Server component (no client JS).
 */

import type {
  AnomalyAlert,
  EndpointCostRow,
  HourlyHeatCell,
} from "@/lib/mock-fixtures/admin-ai-cost";

export interface AdminAiCostExtraLabels {
  readonly heatmapTitle: string;
  readonly heatmapSubtitle: string;
  readonly endpointTitle: string;
  readonly endpointSubtitle: string;
  readonly endpointCols: {
    readonly endpoint: string;
    readonly calls: string;
    readonly cost: string;
    readonly share: string;
    readonly p95: string;
    readonly error: string;
  };
  readonly anomalyTitle: string;
  readonly forecastTitle: string;
  readonly forecastMtd: string;
  readonly forecastBudget: string;
  readonly forecastEom: string;
  readonly forecastPacing: string;
  readonly forecastDaysRemaining: string;
  readonly daysLeft: {
    readonly mon: string;
    readonly tue: string;
    readonly wed: string;
    readonly thu: string;
    readonly fri: string;
    readonly sat: string;
    readonly sun: string;
  };
}

const HOURS_LABELS = Array.from({ length: 24 }, (_, i) => i);

export function HourlyHeatmap({
  data,
  labels,
}: {
  data: ReadonlyArray<HourlyHeatCell>;
  labels: AdminAiCostExtraLabels;
}) {
  const getCost = (d: number, h: number) =>
    data.find((c) => c.day === d && c.hour === h)?.costKrw ?? 0;
  const max = Math.max(...data.map((c) => c.costKrw), 1);
  const cellColor = (v: number) => {
    if (v === 0) return "rgba(26,34,56,0.03)";
    const opacity = Math.min(1, v / max + 0.1);
    return `rgba(217, 119, 6, ${opacity.toFixed(2)})`;
  };
  const dayLabels = [
    labels.daysLeft.mon,
    labels.daysLeft.tue,
    labels.daysLeft.wed,
    labels.daysLeft.thu,
    labels.daysLeft.fri,
    labels.daysLeft.sat,
    labels.daysLeft.sun,
  ];

  return (
    <section
      data-testid="admin-ai-cost-heatmap"
      className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="mb-3">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {labels.heatmapTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.heatmapSubtitle}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[2px] text-[9.5px]">
          <thead>
            <tr>
              <th aria-hidden="true" className="w-8" />
              {HOURS_LABELS.map((h) => (
                <th
                  key={h}
                  className="text-center font-mono text-hesya-navy-900/40"
                >
                  {h % 3 === 0 ? h.toString().padStart(2, "0") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayLabels.map((label, d) => (
              <tr key={d}>
                <td className="pr-2 text-right font-mono text-hesya-navy-900/55">
                  {label}
                </td>
                {HOURS_LABELS.map((h) => {
                  const v = getCost(d, h);
                  return (
                    <td
                      key={h}
                      title={`${label} ${h}:00 — ₩${v.toLocaleString("ko")}`}
                      className="h-5 rounded-sm"
                      style={{ backgroundColor: cellColor(v) }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EndpointCostTable({
  rows,
  labels,
}: {
  rows: ReadonlyArray<EndpointCostRow>;
  labels: AdminAiCostExtraLabels;
}) {
  const c = labels.endpointCols;
  return (
    <section
      data-testid="admin-ai-cost-endpoints"
      className="rounded-md border border-gray-200 bg-white shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="border-b border-hesya-peach-100 px-5 py-3">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {labels.endpointTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.endpointSubtitle}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b border-hesya-peach-100 text-left">
              <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.endpoint}
              </th>
              <th className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.calls}
              </th>
              <th className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.cost}
              </th>
              <th className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.share}
              </th>
              <th className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.p95}
              </th>
              <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.error}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.endpoint}
                className="border-b border-hesya-peach-50 last:border-b-0"
              >
                <td className="px-5 py-2.5">
                  <div className="font-mono text-[11px] text-hesya-navy-900">
                    {row.endpoint}
                  </div>
                  <div className="text-[10.5px] text-hesya-navy-900/55">
                    {row.description}
                  </div>
                </td>
                <td className="py-2.5 text-right font-mono text-[11px] text-hesya-navy-900/70">
                  {row.messageCount.toLocaleString("ko")}
                </td>
                <td className="py-2.5 text-right font-mono text-[11.5px] font-semibold text-hesya-navy-900">
                  ₩{row.costKrw.toLocaleString("ko")}
                </td>
                <td className="py-2.5 text-right">
                  <div className="ml-auto flex w-20 items-center gap-2">
                    <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-hesya-peach-50">
                      <div
                        className="absolute inset-y-0 left-0 bg-hesya-amber-500"
                        style={{ width: `${row.sharePct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-hesya-navy-900/55">
                      {row.sharePct}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-mono text-[11px] text-hesya-navy-900/70">
                  {row.p95LatencyMs}ms
                </td>
                <td
                  className={`px-5 py-2.5 text-right font-mono text-[11px] ${
                    row.errorRate >= 1
                      ? "text-rose-600"
                      : row.errorRate >= 0.5
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {row.errorRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnomalyAlerts({
  alerts,
  title,
}: {
  alerts: ReadonlyArray<AnomalyAlert>;
  title: string;
}) {
  const tone = {
    danger: "border-rose-200 bg-rose-50/60",
    warn: "border-amber-200 bg-amber-50/60",
    info: "border-emerald-200 bg-emerald-50/60",
  };
  const deltaColor = {
    danger: "text-rose-700",
    warn: "text-amber-700",
    info: "text-emerald-700",
  };
  return (
    <section data-testid="admin-ai-cost-anomaly">
      <h3 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {alerts.map((a, i) => (
          <article key={i} className={`rounded-md border p-4 ${tone[a.tone]}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <span aria-hidden="true" className="text-[20px]">
                {a.icon}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${deltaColor[a.tone]}`}
              >
                {a.delta}
              </span>
            </div>
            <p className="font-display text-[13px] font-semibold italic text-hesya-navy-900">
              {a.title}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-hesya-navy-900/65 [word-break:keep-all]">
              {a.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BudgetForecast({
  monthToDateKrw,
  monthBudgetKrw,
  forecastEomKrw,
  daysRemaining,
  pacingPct,
  labels,
}: {
  monthToDateKrw: number;
  monthBudgetKrw: number;
  forecastEomKrw: number;
  daysRemaining: number;
  pacingPct: number;
  labels: AdminAiCostExtraLabels;
}) {
  const overForecast = forecastEomKrw > monthBudgetKrw;
  const pacingExceeded = pacingPct > 90;
  const mtdPct =
    monthBudgetKrw > 0 ? (monthToDateKrw / monthBudgetKrw) * 100 : 0;
  const overBy = Math.max(0, forecastEomKrw - monthBudgetKrw);
  const statusChip = overForecast
    ? {
        bg: "bg-rose-50 text-rose-700 ring-rose-200",
        dot: "bg-rose-500",
        label: "예산 초과 예상",
      }
    : pacingExceeded
      ? {
          bg: "bg-amber-50 text-amber-700 ring-amber-200",
          dot: "bg-amber-500",
          label: "페이싱 경고",
        }
      : {
          bg: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          dot: "bg-emerald-500",
          label: "정상 페이싱",
        };

  return (
    <section
      data-testid="admin-ai-cost-forecast"
      className={`rounded-md border bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ${overForecast ? "border-rose-200 ring-1 ring-rose-100" : "border-gray-200"}`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {labels.forecastTitle}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ring-1 ${statusChip.bg}`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusChip.dot}`}
          />
          {statusChip.label}
        </span>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-hesya-navy-900/45">
            {labels.forecastMtd}
          </p>
          <p className="mt-1 font-heading text-[22px] font-medium italic leading-none text-hesya-navy-900">
            ₩{monthToDateKrw.toLocaleString("ko")}
          </p>
          <p className="mt-1 text-[10.5px] text-hesya-navy-900/55">
            / ₩{monthBudgetKrw.toLocaleString("ko")} {labels.forecastBudget}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
            <div
              className="h-full bg-hesya-amber-500"
              style={{ width: `${Math.min(100, mtdPct)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-hesya-navy-900/45">
            {labels.forecastEom}
          </p>
          <p
            className={`mt-1 font-heading text-[22px] font-medium italic leading-none ${overForecast ? "text-rose-700" : "text-hesya-navy-900"}`}
          >
            ₩{forecastEomKrw.toLocaleString("ko")}
          </p>
          <p className="mt-1 text-[10.5px] text-hesya-navy-900/55">
            {labels.forecastDaysRemaining}: {daysRemaining}
          </p>
          {overForecast && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-rose-700">
              <span aria-hidden="true">⚠</span>+₩{overBy.toLocaleString("ko")}
            </p>
          )}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-hesya-navy-900/45">
            {labels.forecastPacing}
          </p>
          <p
            className={`mt-1 font-heading text-[22px] font-medium italic leading-none ${pacingExceeded ? "text-rose-700" : "text-hesya-navy-900"}`}
          >
            {pacingPct}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
            <div
              className={`h-full ${pacingExceeded ? "bg-rose-500" : pacingPct > 75 ? "bg-amber-500" : "bg-hesya-amber-600"}`}
              style={{ width: `${Math.min(100, pacingPct)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
