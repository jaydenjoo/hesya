/**
 * Plan v3 M4.4 — admin AI cost dashboard.
 *
 * messages.aiModel + 모델별 평균 단가 상수로 추정 cost 표시 (token-level
 * 정확 추적은 Phase 2). 일일 예산 progress + 14일 sparkline + 모델별 분포.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import {
  AnomalyAlerts,
  BudgetForecast,
  EndpointCostTable,
  HourlyHeatmap,
  type AdminAiCostExtraLabels,
} from "@/features/admin-ai-cost/mock-extras";
import {
  mockAnomalyAlerts,
  mockBudgetForecast,
  mockEndpointCosts,
  mockHourlyHeatmap,
} from "@/lib/mock-fixtures/admin-ai-cost";
import { env } from "@/shared/config/env";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import { getAiCostSummary } from "@/shared/lib/dal/ai-cost";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminAiCostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const guard = await requireAdminRole();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const summary = await getAiCostSummary(db);
  const t = await getTranslations({ locale, namespace: "AdminAiCost" });

  const extraLabels: AdminAiCostExtraLabels = {
    heatmapTitle: t("heatmapTitle"),
    heatmapSubtitle: t("heatmapSubtitle"),
    endpointTitle: t("endpointTitle"),
    endpointSubtitle: t("endpointSubtitle"),
    endpointCols: {
      endpoint: t("endpointCols.endpoint"),
      calls: t("endpointCols.calls"),
      cost: t("endpointCols.cost"),
      share: t("endpointCols.share"),
      p95: t("endpointCols.p95"),
      error: t("endpointCols.error"),
    },
    anomalyTitle: t("anomalyTitle"),
    forecastTitle: t("forecastTitle"),
    forecastMtd: t("forecastMtd"),
    forecastBudget: t("forecastBudget"),
    forecastEom: t("forecastEom"),
    forecastPacing: t("forecastPacing"),
    forecastDaysRemaining: t("forecastDaysRemaining"),
    daysLeft: {
      mon: t("days.mon"),
      tue: t("days.tue"),
      wed: t("days.wed"),
      thu: t("days.thu"),
      fri: t("days.fri"),
      sat: t("days.sat"),
      sun: t("days.sun"),
    },
  };

  const overBudget = summary.dailyBudgetPct >= 100;
  const nearBudget = !overBudget && summary.dailyBudgetPct >= 80;

  // sparkline (SVG 단순 polyline)
  const maxCost = Math.max(...summary.last14Days.map((d) => d.totalKrw), 1);
  const sparkPoints = summary.last14Days
    .map((d, i) => {
      const x = (i / (summary.last14Days.length - 1)) * 280;
      const y = 60 - (d.totalKrw / maxCost) * 50;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-full bg-hesya-peach-50/30">
      <PageHeader
        eyebrow="Admin · AI Cost"
        title={t("title")}
        right={
          <Link
            href={`/${locale}/admin/dashboard`}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-hesya-amber-600 transition hover:text-hesya-amber-700"
          >
            ← {t("backToDashboard")}
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-[13px] leading-relaxed text-hesya-navy-900/65">
            {t("disclaimer")}
          </p>
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Time range"
              className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-hesya-peach-200"
            >
              {[
                { k: "today", l: "오늘" },
                { k: "week", l: "이번 주" },
                { k: "month", l: "이번 달", active: true },
                { k: "quarter", l: "분기" },
              ].map((p) => (
                <button
                  key={p.k}
                  type="button"
                  role="tab"
                  aria-selected={!!p.active}
                  className={
                    "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
                    (p.active
                      ? "bg-hesya-amber-500 text-white shadow-[0_2px_6px_rgba(232,169,122,0.35)]"
                      : "text-hesya-navy-900/65 hover:bg-hesya-peach-50")
                  }
                >
                  {p.l}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8c9a6] bg-[#faeee0] px-3 py-1 font-mono text-[10.5px] font-semibold text-[#b86a2a]">
              <span aria-hidden="true">⚡</span>
              일일 예산 87% 사용
            </span>
          </div>
        </div>

        {/* Today's cost + budget */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
                {t("todayCost")}
              </div>
              <div className="mt-2 font-heading text-[36px] font-medium italic leading-none tracking-[-0.02em] text-hesya-navy-900">
                ₩{summary.todayEstimatedKrw.toLocaleString("ko")}
              </div>
              <div className="mt-1.5 text-[11px] text-hesya-navy-900/55">
                {t("todayMessages", { n: summary.todayMessageCount })}
              </div>
            </div>

            <div
              className={`rounded-md border p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ${
                overBudget
                  ? "border-hesya-danger-200 bg-hesya-danger-50"
                  : nearBudget
                    ? "border-hesya-peach-200 bg-[#fbf1e6]"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
                {t("dailyBudget")}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-[36px] font-medium italic leading-none tracking-[-0.02em] text-hesya-navy-900">
                  {summary.dailyBudgetPct}%
                </span>
                <span className="text-[11px] text-hesya-navy-900/55">
                  ₩{summary.dailyBudgetKrw.toLocaleString("ko")}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-hesya-navy-900/10">
                <div
                  className={`h-full ${overBudget ? "bg-rose-500" : nearBudget ? "bg-amber-500" : "bg-hesya-amber-600"}`}
                  style={{ width: `${Math.min(100, summary.dailyBudgetPct)}%` }}
                />
              </div>
              {overBudget && (
                <p className="mt-2 text-[11px] font-medium text-rose-700">
                  ⚠ {t("overBudget")}
                </p>
              )}
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
                {t("trend14d")}
              </div>
              <svg
                viewBox="0 0 280 70"
                className="mt-3 w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="var(--hesya-amber-600, #d97706)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-1.5 flex justify-between text-[10px] text-hesya-navy-900/45">
                <span>{summary.last14Days[0]?.date.slice(5)}</span>
                <span>
                  {summary.last14Days[
                    summary.last14Days.length - 1
                  ]?.date.slice(5)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* By model */}
        <section>
          <h2 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
            {t("byModel")}
          </h2>
          {summary.byModel.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-white/60 px-5 py-8 text-center text-[13px] text-hesya-navy-900/55">
              {t("byModelEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-hesya-peach-100 rounded-md border border-gray-200 bg-white shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
              {(() => {
                const maxKrw = summary.byModel.reduce(
                  (a, b) => Math.max(a, b.estimatedKrw),
                  1,
                );
                return summary.byModel.map((row, idx) => {
                  const pct = (row.estimatedKrw / maxKrw) * 100;
                  const lead = idx === 0;
                  const isOpus = row.model.toLowerCase().includes("opus");
                  return (
                    <li key={row.model} className="space-y-1.5 px-5 py-3">
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold tabular-nums ${
                            lead
                              ? "bg-hesya-amber-500 text-white"
                              : "bg-hesya-peach-100 text-hesya-amber-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 truncate font-mono text-[12px] text-hesya-navy-900">
                          {row.model}
                        </span>
                        <span className="shrink-0 text-[12px] text-hesya-navy-900/55 tabular-nums">
                          {t("messageCount", { n: row.messageCount })}
                        </span>
                        <span className="shrink-0 font-mono text-[13px] font-semibold text-hesya-navy-900 tabular-nums">
                          ₩{row.estimatedKrw.toLocaleString("ko")}
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="ml-9 h-1 overflow-hidden rounded-full bg-hesya-peach-50"
                      >
                        <div
                          className={`h-full ${isOpus ? "bg-hesya-amber-600" : "bg-hesya-peach-200"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                });
              })()}
            </ul>
          )}
        </section>

        {env.MOCK_FIXTURES && (
          <>
            <div className="mt-10 mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
                {t("richSection")}
              </span>
              <span className="h-px flex-1 bg-hesya-navy-900/8" />
            </div>

            <div className="mb-4">
              <BudgetForecast
                monthToDateKrw={mockBudgetForecast.monthToDateKrw}
                monthBudgetKrw={mockBudgetForecast.monthBudgetKrw}
                forecastEomKrw={mockBudgetForecast.forecastEomKrw}
                daysRemaining={mockBudgetForecast.daysRemaining}
                pacingPct={mockBudgetForecast.pacingPct}
                labels={extraLabels}
              />
            </div>

            <div className="mb-4">
              <HourlyHeatmap data={mockHourlyHeatmap} labels={extraLabels} />
            </div>

            <div className="mb-6">
              <EndpointCostTable
                rows={mockEndpointCosts}
                labels={extraLabels}
              />
            </div>

            <AnomalyAlerts
              alerts={mockAnomalyAlerts}
              title={t("anomalyTitle")}
            />
          </>
        )}
      </div>
    </div>
  );
}
