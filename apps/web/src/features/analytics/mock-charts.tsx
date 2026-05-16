/**
 * Sprint 2C PR-C3 — Analytics rich mock charts.
 *
 * Reference: `docs/design/reference/analytics-charts2.jsx`.
 * 4 차트 (Heatmap / Funnel / CohortTable / StackedBar) + InsightBand.
 * Server component — interactive 없음 (display only).
 */

import type {
  CohortRow,
  FunnelStage,
  HeatmapCell,
  MockInsight,
  StackedBarMonth,
} from "@/lib/mock-fixtures/analytics";

export interface AnalyticsMockChartLabels {
  readonly heatmapTitle: string;
  readonly heatmapSubtitle: string;
  readonly funnelTitle: string;
  readonly funnelSubtitle: string;
  readonly funnelConvSuffix: string;
  readonly cohortTitle: string;
  readonly cohortSubtitle: string;
  readonly cohortNewLabel: string;
  readonly stackedBarTitle: string;
  readonly stackedBarSubtitle: string;
  readonly stackedBarLegend: {
    readonly stripe: string;
    readonly alipay: string;
    readonly wechat: string;
    readonly linepay: string;
  };
  readonly insightsTitle: string;
  readonly featuredInsightEyebrow: string;
  readonly featuredInsightBody: string;
  readonly featuredInsightDataLabel: string;
  readonly featuredInsightChip1: string;
  readonly featuredInsightChip2: string;
  readonly featuredInsightChip3: string;
  readonly featuredInsightCta: string;
}

export function HeatmapChart({
  data,
  days,
  hours,
  labels,
}: {
  data: ReadonlyArray<HeatmapCell>;
  days: ReadonlyArray<string>;
  hours: ReadonlyArray<number>;
  labels: AnalyticsMockChartLabels;
}) {
  const getValue = (d: number, h: number) =>
    data.find((c) => c.day === d && c.hour === h)?.value ?? 0;
  const cellColor = (v: number) => {
    if (v === 0) return "rgba(26,34,56,0.03)";
    const opacity = Math.min(1, v / 100 + 0.08);
    return `rgba(232, 169, 122, ${opacity.toFixed(2)})`;
  };

  return (
    <section
      data-testid="analytics-heatmap"
      className="rounded-2xl bg-white p-5 ring-1 ring-hesya-navy-900/5"
    >
      <header className="mb-3">
        <h3 className="font-heading text-[18px] font-semibold italic text-hesya-navy-900">
          {labels.heatmapTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.heatmapSubtitle}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[2px] text-[10px]">
          <thead>
            <tr>
              <th aria-hidden="true" className="w-8" />
              {days.map((d) => (
                <th
                  key={d}
                  className="text-center font-medium uppercase tracking-[0.08em] text-hesya-navy-900/45"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h}>
                <td className="pr-2 text-right font-mono text-hesya-navy-900/45">
                  {h.toString().padStart(2, "0")}
                </td>
                {days.map((_, dIdx) => {
                  const v = getValue(dIdx, h);
                  return (
                    <td
                      key={`${dIdx}-${h}`}
                      title={`${days[dIdx]} ${h}:00 · ${v}`}
                      className="h-5 rounded-sm text-center font-mono text-[9px] text-hesya-navy-900/70"
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

export function FunnelChart({
  stages,
  labels,
}: {
  stages: ReadonlyArray<FunnelStage>;
  labels: AnalyticsMockChartLabels;
}) {
  const max = stages[0]?.value ?? 1;
  return (
    <section
      data-testid="analytics-funnel"
      className="rounded-2xl bg-white p-5 ring-1 ring-hesya-navy-900/5"
    >
      <header className="mb-4">
        <h3 className="font-heading text-[18px] font-semibold italic text-hesya-navy-900">
          {labels.funnelTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.funnelSubtitle}
        </p>
      </header>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const widthPct = (s.value / max) * 100;
          const convFromPrev =
            i > 0 ? (s.value / stages[i - 1]!.value) * 100 : 100;
          return (
            <div key={s.label}>
              <div className="mb-1 flex items-baseline justify-between text-[12px]">
                <span className="font-medium text-hesya-navy-900">
                  {s.label}
                </span>
                <span className="font-mono text-hesya-navy-900/65">
                  {s.value.toLocaleString("en-US")}
                  {i > 0 && (
                    <span className="ml-2 text-[10.5px] text-hesya-amber-600">
                      {convFromPrev.toFixed(1)}
                      {labels.funnelConvSuffix}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-7 overflow-hidden rounded-md bg-hesya-peach-50">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-hesya-amber-500 to-hesya-amber-600"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {s.hint && (
                <p className="mt-0.5 text-[10.5px] text-hesya-navy-900/40">
                  {s.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CohortTable({
  rows,
  slots,
  labels,
}: {
  rows: ReadonlyArray<CohortRow>;
  slots: ReadonlyArray<string>;
  labels: AnalyticsMockChartLabels;
}) {
  const cellColor = (v: number | null) => {
    if (v === null) return "rgba(26,34,56,0.02)";
    if (v >= 80) return "rgba(232,169,122,0.95)";
    if (v >= 40) return "rgba(232,169,122,0.65)";
    if (v >= 20) return "rgba(232,169,122,0.35)";
    return "rgba(232,169,122,0.15)";
  };
  const textColor = (v: number | null) =>
    v === null ? "transparent" : v >= 40 ? "#1A2238" : "rgba(26,34,56,0.65)";

  return (
    <section
      data-testid="analytics-cohort"
      className="rounded-2xl bg-white p-5 ring-1 ring-hesya-navy-900/5"
    >
      <header className="mb-3">
        <h3 className="font-heading text-[18px] font-semibold italic text-hesya-navy-900">
          {labels.cohortTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.cohortSubtitle}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[2px] text-[11px]">
          <thead>
            <tr>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.06em] text-hesya-navy-900/45">
                Cohort
              </th>
              <th className="px-2 text-right font-mono text-[10px] uppercase tracking-[0.06em] text-hesya-navy-900/45">
                {labels.cohortNewLabel}
              </th>
              {slots.map((s) => (
                <th
                  key={s}
                  className="text-center font-mono text-[10px] uppercase tracking-[0.06em] text-hesya-navy-900/45"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cohort}>
                <td className="font-mono text-[11px] font-medium text-hesya-navy-900">
                  {r.cohort}
                </td>
                <td className="px-2 text-right font-mono text-[11px] text-hesya-navy-900/65">
                  {r.size}
                </td>
                {r.retention.map((v, i) => (
                  <td
                    key={i}
                    className="h-7 rounded-sm text-center font-mono text-[11px] font-semibold"
                    style={{
                      backgroundColor: cellColor(v),
                      color: textColor(v),
                    }}
                  >
                    {v !== null ? `${v}%` : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StackedBarChart({
  data,
  labels,
}: {
  data: ReadonlyArray<StackedBarMonth>;
  labels: AnalyticsMockChartLabels;
}) {
  const max = Math.max(
    ...data.map((d) => d.stripe + d.alipay + d.wechat + d.linepay),
  );

  const colors = {
    stripe: "#635BFF",
    alipay: "#1677FF",
    wechat: "#07C160",
    linepay: "#00B900",
  };

  const fmt = (n: number) => `${Math.round(n / 1_000_000)}M`;

  return (
    <section
      data-testid="analytics-stackedbar"
      className="rounded-2xl bg-white p-5 ring-1 ring-hesya-navy-900/5"
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-heading text-[18px] font-semibold italic text-hesya-navy-900">
            {labels.stackedBarTitle}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
            {labels.stackedBarSubtitle}
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-[11px]">
          {(["stripe", "alipay", "wechat", "linepay"] as const).map((k) => (
            <li
              key={k}
              className="flex items-center gap-1.5 text-hesya-navy-900/70"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: colors[k] }}
              />
              {labels.stackedBarLegend[k]}
            </li>
          ))}
        </ul>
      </header>
      <div
        className="flex items-end justify-around gap-2"
        style={{ height: 200 }}
      >
        {data.map((m) => {
          const total = m.stripe + m.alipay + m.wechat + m.linepay;
          const totalHeightPct = (total / max) * 100;
          return (
            <div
              key={m.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="font-mono text-[10px] font-semibold text-hesya-navy-900/70">
                {fmt(total)}
              </span>
              <div
                className="flex w-full max-w-[40px] flex-col-reverse overflow-hidden rounded-md"
                style={{ height: `${totalHeightPct}%` }}
              >
                <div
                  style={{
                    backgroundColor: colors.stripe,
                    flex: m.stripe,
                  }}
                />
                <div
                  style={{
                    backgroundColor: colors.alipay,
                    flex: m.alipay,
                  }}
                />
                <div
                  style={{
                    backgroundColor: colors.wechat,
                    flex: m.wechat,
                  }}
                />
                <div
                  style={{
                    backgroundColor: colors.linepay,
                    flex: m.linepay,
                  }}
                />
              </div>
              <span className="font-mono text-[10.5px] text-hesya-navy-900/55">
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FeaturedInsight({
  labels,
}: {
  labels: Pick<
    AnalyticsMockChartLabels,
    | "featuredInsightEyebrow"
    | "featuredInsightBody"
    | "featuredInsightDataLabel"
    | "featuredInsightChip1"
    | "featuredInsightChip2"
    | "featuredInsightChip3"
    | "featuredInsightCta"
  >;
}) {
  return (
    <section
      data-testid="analytics-featured-insight"
      className="mb-6 overflow-hidden rounded-2xl border border-hesya-amber-500/30 bg-gradient-to-br from-hesya-peach-50 via-white to-hesya-amber-500/5 px-5 py-4 shadow-[0_2px_8px_rgba(232,169,122,0.10)]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-hesya-amber-500/15 text-[20px]">
            💡
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-700">
              {labels.featuredInsightEyebrow}
            </p>
            <p className="text-[13.5px] leading-relaxed text-hesya-navy-900 [word-break:keep-all]">
              {labels.featuredInsightBody}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] text-hesya-navy-900/55">
                {labels.featuredInsightDataLabel}
              </span>
              {[
                labels.featuredInsightChip1,
                labels.featuredInsightChip2,
                labels.featuredInsightChip3,
              ].map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-hesya-amber-500/30 bg-white px-2.5 py-0.5 text-[10.5px] font-medium text-hesya-navy-900/75"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full bg-hesya-navy-900 px-4 py-2 text-[12px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 md:self-auto"
        >
          {labels.featuredInsightCta}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

export function InsightBand({
  insights,
  title,
}: {
  insights: ReadonlyArray<MockInsight>;
  title: string;
}) {
  const tone = {
    positive: "border-emerald-200 bg-emerald-50/60",
    warning: "border-amber-300 bg-amber-50/60",
    info: "border-hesya-navy-900/10 bg-hesya-peach-50/60",
  };
  return (
    <section data-testid="analytics-insights">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-hesya-amber-600">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {insights.map((i, idx) => (
          <article
            key={idx}
            className={`rounded-xl border p-4 ${tone[i.tone]}`}
          >
            <span aria-hidden="true" className="mb-2 block text-[22px]">
              {i.icon}
            </span>
            <p className="font-heading text-[14px] font-semibold italic text-hesya-navy-900">
              {i.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-hesya-navy-900/65 [word-break:keep-all]">
              {i.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
