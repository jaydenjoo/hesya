import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { DistributionPie } from "@/features/dashboard";
import { MonthlyRevenueChart } from "@/features/analytics/monthly-revenue-chart";
import {
  CohortTable,
  FeaturedInsight,
  FunnelChart,
  HeatmapChart,
  InsightBand,
  StackedBarChart,
  type AnalyticsMockChartLabels,
} from "@/features/analytics/mock-charts";
import {
  mockCohortRows,
  mockCohortSlots,
  mockFunnelStages,
  mockHeatmapData,
  mockHeatmapDays,
  mockHeatmapHours,
  mockInsights,
  mockStackedBarData,
} from "@/lib/mock-fixtures/analytics";
import { env } from "@/shared/config/env";
import {
  getMonthlyRevenue,
  getNationalityBreakdown,
  getRepeatRate,
  getTopServices,
  getTopStaff,
} from "@/shared/lib/dal/analytics";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v4 Sprint 1 Epic E — 매장 owner Analytics.
 *
 * 5 차트: 월별 매출 bar / 재방문률 KPI / 국적 분포 pie / 시술 TOP5 list /
 * 디자이너 TOP5 list. 모두 기존 bookings/customers/staff/services 테이블만
 * 사용. 스키마 변경 0.
 *
 * 가드 실패 → /sign-in. 매장 owner 인증 후 storeId 자동 추출.
 *
 * 캐시: 60s unstable_cache. 데이터 변경 빈도 낮고 매장 사장 새로고침
 * 패턴 잦음 → cache hit 비율 높음.
 */

const getCachedAnalytics = unstable_cache(
  async (storeId: string) => {
    const db = createDbClient(env.DATABASE_URL);
    const [monthly, nationality, services, staff, repeat] = await Promise.all([
      getMonthlyRevenue(db, storeId, 6),
      getNationalityBreakdown(db, storeId),
      getTopServices(db, storeId, 5),
      getTopStaff(db, storeId, 5),
      getRepeatRate(db, storeId),
    ]);
    return { monthly, nationality, services, staff, repeat };
  },
  ["store-analytics-v1"],
  { revalidate: 60, tags: ["store-analytics"] },
);

export default async function StoreAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let storeId: string;
  try {
    const session = await requireStoreOwnerAuth();
    storeId = session.storeId;
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const t = await getTranslations("StoreAnalytics");
  const data = await getCachedAnalytics(storeId);

  const mockChartLabels: AnalyticsMockChartLabels = {
    heatmapTitle: t("heatmapTitle"),
    heatmapSubtitle: t("heatmapSubtitle"),
    funnelTitle: t("funnelTitle"),
    funnelSubtitle: t("funnelSubtitle"),
    funnelConvSuffix: t("funnelConvSuffix"),
    cohortTitle: t("cohortTitle"),
    cohortSubtitle: t("cohortSubtitle"),
    cohortNewLabel: t("cohortNewLabel"),
    stackedBarTitle: t("stackedBarTitle"),
    stackedBarSubtitle: t("stackedBarSubtitle"),
    stackedBarLegend: {
      stripe: t("stackedBarLegend.stripe"),
      alipay: t("stackedBarLegend.alipay"),
      wechat: t("stackedBarLegend.wechat"),
      linepay: t("stackedBarLegend.linepay"),
    },
    insightsTitle: t("insightsTitle"),
    featuredInsightEyebrow: t("featuredInsightEyebrow"),
    featuredInsightBody: t("featuredInsightBody"),
    featuredInsightDataLabel: t("featuredInsightDataLabel"),
    featuredInsightChip1: t("featuredInsightChip1"),
    featuredInsightChip2: t("featuredInsightChip2"),
    featuredInsightChip3: t("featuredInsightChip3"),
    featuredInsightCta: t("featuredInsightCta"),
  };

  const repeatPct = Math.round(data.repeat.repeatRate * 100);
  const totalRevenue = data.monthly.reduce((a, b) => a + b.revenueKrw, 0);
  const totalBookings = data.monthly.reduce((a, b) => a + b.bookingCount, 0);
  const avgTicket =
    totalBookings === 0 ? 0 : Math.round(totalRevenue / totalBookings);

  const revenueSeries = data.monthly.map((m) => m.revenueKrw);
  const bookingSeries = data.monthly.map((m) => m.bookingCount);
  const monthLen = data.monthly.length;
  const revenueTrend =
    monthLen >= 2 && revenueSeries[monthLen - 2]! > 0
      ? Math.round(
          ((revenueSeries[monthLen - 1]! - revenueSeries[monthLen - 2]!) /
            revenueSeries[monthLen - 2]!) *
            100,
        )
      : 0;
  const bookingTrend =
    monthLen >= 2 && bookingSeries[monthLen - 2]! > 0
      ? Math.round(
          ((bookingSeries[monthLen - 1]! - bookingSeries[monthLen - 2]!) /
            bookingSeries[monthLen - 2]!) *
            100,
        )
      : 0;

  return (
    <div className="bg-hesya-peach-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
              Operator · Analytics
            </p>
            <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
              {t("title")}
            </h1>
            <p className="kr text-[13px] text-gray-600">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Time range"
              className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-hesya-peach-200"
            >
              {[
                { k: "day", l: "일" },
                { k: "week", l: "주" },
                { k: "month", l: "월", active: true },
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
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-hesya-navy-900 px-3.5 py-1.5 text-[11px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90"
            >
              <span aria-hidden="true">⬇</span>
              PDF
            </button>
          </div>
        </header>

        {/* KPI 3개 row */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiTile
            label={t("kpiRevenue6m")}
            value={`₩${totalRevenue.toLocaleString("ko-KR")}`}
            hint={`${totalBookings}${t("bookingsUnit")}`}
            trend={revenueTrend}
            spark={revenueSeries}
            sparkColor="#1A2238"
          />
          <KpiTile
            label={t("kpiRepeatRate")}
            value={`${repeatPct}%`}
            hint={`${data.repeat.repeatCustomers}/${data.repeat.totalCustomers} ${t("customersUnit")}`}
            ring={repeatPct}
          />
          <KpiTile
            label={t("kpiAvgTicket")}
            value={`₩${avgTicket.toLocaleString("ko-KR")}`}
            hint={t("avgTicketHint")}
            trend={bookingTrend}
            spark={bookingSeries}
            sparkColor="#D88B5B"
          />
        </section>

        {/* 차트 row 1 — 매출 + 국적 */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-hesya-peach-100 bg-white p-5 shadow-[0_2px_8px_rgba(26,34,56,0.04),0_4px_16px_rgba(26,34,56,0.06)] lg:col-span-2">
            <h2 className="mb-3 font-semibold text-[14px] text-hesya-navy-900">
              {t("monthlyRevenueTitle")}
            </h2>
            <MonthlyRevenueChart data={data.monthly} />
          </article>
          <article className="rounded-2xl border border-hesya-peach-100 bg-white p-5 shadow-[0_2px_8px_rgba(26,34,56,0.04),0_4px_16px_rgba(26,34,56,0.06)]">
            <h2 className="mb-3 font-semibold text-[14px] text-hesya-navy-900">
              {t("nationalityTitle")}
            </h2>
            <DistributionPie
              data={data.nationality.slice(0, 6).map((n) => ({
                label: n.nationality,
                value: n.count,
              }))}
            />
            <ul className="mt-3 space-y-1 text-[11px] text-hesya-navy-900/70">
              {data.nationality.slice(0, 6).map((n) => (
                <li
                  key={n.nationality}
                  className="flex items-center justify-between"
                >
                  <span>{n.nationality}</span>
                  <span className="font-mono">{n.count}</span>
                </li>
              ))}
              {data.nationality.length === 0 && <li>{t("noData")}</li>}
            </ul>
          </article>
        </section>

        {/* 차트 row 2 — 시술 + 디자이너 TOP5 */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RankList
            title={t("topServicesTitle")}
            items={data.services.map((s) => ({
              name: s.serviceName,
              count: s.bookingCount,
              revenueKrw: s.revenueKrw,
            }))}
            countLabel={t("bookingsUnit")}
            emptyLabel={t("noData")}
          />
          <RankList
            title={t("topStaffTitle")}
            items={data.staff.map((s) => ({
              name: s.staffName,
              count: s.bookingCount,
              revenueKrw: s.revenueKrw,
            }))}
            countLabel={t("bookingsUnit")}
            emptyLabel={t("noData")}
          />
        </section>

        {env.MOCK_FIXTURES && (
          <>
            <div className="mt-10 mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
                {t("richSection")}
              </span>
              <span className="h-px flex-1 bg-hesya-navy-900/8" />
            </div>

            <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HeatmapChart
                data={mockHeatmapData}
                days={mockHeatmapDays}
                hours={mockHeatmapHours}
                labels={mockChartLabels}
              />
              <FunnelChart stages={mockFunnelStages} labels={mockChartLabels} />
            </section>

            <section className="mb-4">
              <CohortTable
                rows={mockCohortRows}
                slots={mockCohortSlots}
                labels={mockChartLabels}
              />
            </section>

            <section className="mb-6">
              <StackedBarChart
                data={mockStackedBarData}
                labels={mockChartLabels}
              />
            </section>

            <FeaturedInsight labels={mockChartLabels} />

            <InsightBand
              insights={mockInsights}
              title={mockChartLabels.insightsTitle}
            />
          </>
        )}
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  trend,
  spark,
  sparkColor,
  ring,
}: {
  label: string;
  value: string;
  hint: string;
  trend?: number;
  spark?: ReadonlyArray<number>;
  sparkColor?: string;
  ring?: number;
}) {
  return (
    <div className="rounded-2xl border border-hesya-peach-100 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(26,34,56,0.04),0_4px_16px_rgba(26,34,56,0.06)]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-hesya-navy-900/50">
          {label}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span
            className={
              "font-mono text-[10.5px] font-semibold " +
              (trend > 0 ? "text-emerald-600" : "text-rose-600")
            }
          >
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 font-display text-[22px] italic text-hesya-navy-900">
        {value}
      </p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-[11px] text-hesya-navy-900/60">{hint}</p>
        {spark && spark.length > 1 && sparkColor && (
          <Sparkline data={spark} color={sparkColor} />
        )}
        {ring !== undefined && <ProgressRing pct={ring} />}
      </div>
    </div>
  );
}

function Sparkline({
  data,
  color,
}: {
  data: ReadonlyArray<number>;
  color: string;
}) {
  const max = Math.max(...data, 1);
  const w = 96;
  const h = 24;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-6 w-24 flex-shrink-0"
      aria-hidden="true"
    >
      <polygon points={areaPts} fill={color} opacity="0.08" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-7 w-7 flex-shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="#F1E1D0"
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="#D88B5B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

interface RankItem {
  name: string;
  count: number;
  revenueKrw: number;
}

function RankList({
  title,
  items,
  countLabel,
  emptyLabel,
}: {
  title: string;
  items: readonly RankItem[];
  countLabel: string;
  emptyLabel: string;
}) {
  return (
    <article className="rounded-2xl border border-hesya-peach-100 bg-white p-5 shadow-[0_2px_8px_rgba(26,34,56,0.04),0_4px_16px_rgba(26,34,56,0.06)]">
      <h2 className="mb-3 font-semibold text-[14px] text-hesya-navy-900">
        {title}
      </h2>
      <ol className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="flex items-center justify-between text-[12px]"
          >
            <span className="flex items-center gap-2 text-hesya-navy-900">
              <span className="font-mono text-[10px] text-hesya-amber-600">
                #{idx + 1}
              </span>
              {item.name}
            </span>
            <span className="font-mono text-[11px] text-hesya-navy-900/70">
              {item.count}
              {countLabel} · ₩{item.revenueKrw.toLocaleString("ko-KR")}
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[12px] text-hesya-navy-900/40">{emptyLabel}</li>
        )}
      </ol>
    </article>
  );
}
