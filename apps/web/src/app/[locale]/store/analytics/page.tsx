import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { DistributionPie } from "@/features/dashboard";
import { MonthlyRevenueChart } from "@/features/analytics/monthly-revenue-chart";
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

  const repeatPct = Math.round(data.repeat.repeatRate * 100);
  const totalRevenue = data.monthly.reduce((a, b) => a + b.revenueKrw, 0);
  const totalBookings = data.monthly.reduce((a, b) => a + b.bookingCount, 0);
  const avgTicket =
    totalBookings === 0 ? 0 : Math.round(totalRevenue / totalBookings);

  return (
    <div className="bg-hesya-peach-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 space-y-1.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Operator · Analytics
          </p>
          <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
            {t("title")}
          </h1>
          <p className="kr text-[13px] text-gray-600">{t("subtitle")}</p>
        </header>

        {/* KPI 3개 row */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiTile
            label={t("kpiRevenue6m")}
            value={`₩${totalRevenue.toLocaleString("ko-KR")}`}
            hint={`${totalBookings}${t("bookingsUnit")}`}
          />
          <KpiTile
            label={t("kpiRepeatRate")}
            value={`${repeatPct}%`}
            hint={`${data.repeat.repeatCustomers}/${data.repeat.totalCustomers} ${t("customersUnit")}`}
          />
          <KpiTile
            label={t("kpiAvgTicket")}
            value={`₩${avgTicket.toLocaleString("ko-KR")}`}
            hint={t("avgTicketHint")}
          />
        </section>

        {/* 차트 row 1 — 매출 + 국적 */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-3 font-semibold text-[14px] text-hesya-navy-900">
              {t("monthlyRevenueTitle")}
            </h2>
            <MonthlyRevenueChart data={data.monthly} />
          </article>
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-hesya-navy-900/50">
        {label}
      </p>
      <p className="mt-1.5 font-display text-[22px] italic text-hesya-navy-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-hesya-navy-900/60">{hint}</p>
    </div>
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
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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
