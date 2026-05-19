/**
 * Plan v3 M6 — admin 통합 dashboard (reference parity Phase 2).
 *
 * 디자인 ref: `docs/design/reference/Hesya Admin Dashboard.html`
 *           + `admin-dashboard.css` (912줄). 운영자 데이터 KPI 4 + 위젯 5 + audit rail.
 *
 * 구조:
 *   - layout.tsx에서 AdminShell (top bar + sidebar) 적용. 본 page는 main 컨텐츠만 출력.
 *   - page-head (title + sub + clock + auto-refresh)
 *   - alert band (4 chip: crit/warn/info/info)
 *   - bento grid 12-col:
 *       4 KPI tile (span 3) | monthly bar (span 6) + AI spark (span 3) + SLA donut (span 3)
 *       | Korea map (span 8) + Top categories (span 4)
 *   - audit rail (옆 360px column — sticky)
 *
 * 위젯(5) 실 데이터 wire 완료: monthly bar (#156) / AI spark (#156) /
 * SLA donut / Korea map / top categories.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import {
  getAdminAlertCounts,
  getAdminAuditTrail,
  getAdminKpiSummary,
  getDailyAiCostSpark,
  getDisputeSlaResolution,
  getMonthlyNewStoresCounts,
  getStoreRegionDistribution,
  getTopCategoriesByGmv,
} from "@/shared/lib/dal/admin-dashboard";
import { getCurrentMonthRange } from "@/shared/lib/dal/dashboard";
import { mockAdminDashboard } from "@/lib/mock-fixtures/admin-dashboard";

import { DashboardBarChart } from "@/features/admin/components/dashboard-bar-chart";
import { DashboardSpark } from "@/features/admin/components/dashboard-spark";
import { DashboardSlaDonut } from "@/features/admin/components/dashboard-sla-donut";
import { DashboardKoreaMap } from "@/features/admin/components/dashboard-korea-map";
import { DashboardTopCategories } from "@/features/admin/components/dashboard-top-categories";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * Admin dashboard 8 DAL 묶음 30초 캐시 — monthKey 단일 key.
 *
 * 모든 admin이 같은 전사 데이터를 봄 (storeId 의존 X). 30s 캐시로 admin 여러 명
 * 또는 새로고침 시 매번 8개 쿼리 polish.
 */
const getAdminDashboardCached = unstable_cache(
  async (monthKey: string) => {
    const [from, to] = monthKey.split("|");
    const monthRange = {
      fromDate: new Date(from!),
      toDate: new Date(to!),
    };
    const db = createDbClient(env.DATABASE_URL);
    const [
      alerts,
      kpi,
      audit,
      monthlyBars,
      costSpark,
      slaResolution,
      regionDist,
      topCategories,
    ] = await Promise.all([
      getAdminAlertCounts(db),
      getAdminKpiSummary(db, monthRange),
      getAdminAuditTrail(db, 12),
      getMonthlyNewStoresCounts(db),
      getDailyAiCostSpark(db),
      getDisputeSlaResolution(db),
      getStoreRegionDistribution(db),
      getTopCategoriesByGmv(db),
    ]);
    return {
      alerts,
      kpi,
      audit,
      monthlyBars,
      costSpark,
      slaResolution,
      regionDist,
      topCategories,
    };
  },
  ["admin-dashboard-v1"],
  {
    revalidate: 30,
    tags: ["stores", "disputes", "bookings", "kyc", "api-policy-alerts"],
  },
);

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // layout에서도 가드하지만 defense-in-depth — 직접 page 호출 시 차단.
  const guard = await requireAdminRole();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const monthRange = getCurrentMonthRange();
  const monthKey = `${monthRange.fromDate.toISOString()}|${monthRange.toDate.toISOString()}`;
  // Mock 데이터 단계 (`MOCK_FIXTURES=true`) — 8 DAL 묶음 대신 fixture 사용.
  // 외부 데모에서 admin UI 첫인상을 풍부한 데이터로 보장. 베타 매장 모집 후
  // env 토글하면 실 DB DAL 자동 fallback (위 `getAdminDashboardCached`).
  const {
    alerts,
    kpi,
    audit,
    monthlyBars,
    costSpark,
    slaResolution,
    regionDist,
    topCategories,
  } = env.MOCK_FIXTURES
    ? mockAdminDashboard
    : await getAdminDashboardCached(monthKey);

  const t = await getTranslations({ locale, namespace: "AdminDashboard" });

  const kVerifiedPct =
    kpi.totalRegistered > 0
      ? Math.round((kpi.activeStores / kpi.totalRegistered) * 100)
      : 0;

  const clockFmt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    hour12: false,
  });
  const clockNow = clockFmt
    .format(new Date())
    .replace(/\./g, "-")
    .replace(/-(?= )/, "");

  return (
    <>
      {/* ─── Page head ─── */}
      <div className="flex items-end justify-between gap-6 border-b border-gray-100 bg-white px-8 pt-7 pb-5">
        <div>
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-hesya-navy-900">
            {t("title")}
          </h1>
          <div className="mt-1.5 text-[13px] text-gray-500">
            <em className="mr-1 font-heading text-[14px] not-italic font-medium italic text-hesya-amber-500">
              오늘 —
            </em>
            {t("pageSub")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[12px] text-gray-500">
            <strong className="font-semibold text-hesya-navy-900">
              {clockNow} KST
            </strong>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded border border-gray-100 bg-[#fafbfc] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
            />
            {t("auto")}
          </span>
        </div>
      </div>

      {/* ─── Alert band ─── */}
      <div className="sticky top-0 z-20 flex gap-3 overflow-x-auto border-b border-gray-100 bg-white px-8 py-3.5">
        <AlertChip
          level="crit"
          icon="🔴"
          label={t("alerts.pendingKyc")}
          count={alerts.pendingKyc}
          href={`/${locale}/admin/store-verifications`}
          meta="SLA 22h"
        />
        <AlertChip
          level="warn"
          icon="🟡"
          label={t("alerts.openDisputes")}
          count={alerts.openDisputes}
          href={`/${locale}/admin/disputes`}
          meta="최고 ₩185,000"
        />
        <AlertChip
          level="budg"
          icon="📣"
          label={t("alerts.newApiPolicyAlerts")}
          count={alerts.newApiPolicyAlerts}
          href={`/${locale}/admin/api-policy-alerts`}
          meta="24h 신규"
        />
        <AlertChip
          level="flag"
          icon="🗑"
          label={t("alerts.pendingStoreDeletions")}
          count={alerts.pendingStoreDeletions}
          href={`/${locale}/admin/store-deletion`}
          meta="7d 보존"
        />
      </div>

      {/* ─── Body: bento + audit rail ─── */}
      <div className="grid items-start gap-6 px-8 pb-10 pt-6 xl:grid-cols-[1fr_360px]">
        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Row 1 — 4 KPI tiles */}
          <Tile span={3}>
            <TileHead
              labelEn="ACTIVE SALONS"
              labelKr={t("kpis.activeStores")}
            />
            <KpiNum value={kpi.activeStores.toLocaleString("ko")} />
            <KpiMeta>
              {t("kpis.activeStoresSub", { total: kpi.totalRegistered })}
            </KpiMeta>
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="K-VERIFIED" labelKr={t("kpis.kVerified")} />
            <KpiNum value={String(kVerifiedPct)} unit="%" />
            <KpiMeta>
              {t("kpis.kVerifiedSub", {
                active: kpi.activeStores,
                total: kpi.totalRegistered,
              })}
            </KpiMeta>
            <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-gray-100">
              <span
                aria-hidden="true"
                className="block h-full rounded-full bg-hesya-amber-500"
                style={{ width: `${kVerifiedPct}%` }}
              />
            </div>
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="NEW TODAY" labelKr={t("kpis.newStoresToday")} />
            <KpiNum value={kpi.newStoresToday.toLocaleString("ko")} />
            <KpiMeta>{t("kpis.newStoresTodaySub")}</KpiMeta>
          </Tile>

          <Tile span={3}>
            <TileHead
              labelEn="FOREIGN GMV · MTD"
              labelKr={t("kpis.foreignGmv")}
            />
            <KpiNum
              value={`₩${kpi.foreignGmvMtdKrw.toLocaleString("ko")}`}
              compact
            />
            <KpiMeta>
              {t("kpis.foreignGmvSub", { n: kpi.foreignBookingsMtd })}
            </KpiMeta>
          </Tile>

          {/* Row 2 — Monthly bar (6) + AI spark (3) + SLA donut (3) */}
          <Tile span={6}>
            <TileHead
              labelEn="NEW SALONS · MONTHLY"
              labelKr="월별 신규 매장 — 최근 12개월"
            />
            <DashboardBarChart data={monthlyBars} />
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="AI COST · DAILY" labelKr="AI 비용 · 일별" />
            <div className="font-heading text-[28px] font-medium italic leading-none tracking-[-0.025em] text-hesya-navy-900">
              <span className="mr-0.5 font-mono text-[12px] not-italic text-gray-500">
                ₩
              </span>
              {costSpark[costSpark.length - 1]?.v.toLocaleString("ko-KR") ??
                "0"}
            </div>
            <KpiMeta>
              {(() => {
                const last = costSpark[costSpark.length - 1]?.v ?? 0;
                const prior29 = costSpark.slice(0, -1);
                const avg29 =
                  prior29.length > 0
                    ? prior29.reduce((s, r) => s + r.v, 0) / prior29.length
                    : 0;
                if (avg29 === 0)
                  return last === 0 ? "AI 메시지 누적 전" : "표본 부족";
                const delta = Math.round(((last - avg29) / avg29) * 100);
                const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "→";
                return `30일 평균 대비 ${arrow} ${Math.abs(delta)}%`;
              })()}
            </KpiMeta>
            <div className="mt-3">
              <DashboardSpark data={costSpark} />
            </div>
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="DISPUTE SLA" labelKr="분쟁 처리 SLA" />
            <DashboardSlaDonut data={slaResolution} />
          </Tile>

          {/* Row 3 — Korea map (8) + Top 5 (4) */}
          <Tile span={8}>
            <TileHead
              labelEn="REGIONAL DISTRIBUTION"
              labelKr="지역별 활성 매장 분포"
            />
            <DashboardKoreaMap data={regionDist} />
          </Tile>

          <Tile span={4}>
            <TileHead
              labelEn="TOP CATEGORIES · 30D"
              labelKr="상위 5 카테고리"
            />
            <div className="mt-2">
              <DashboardTopCategories rows={topCategories} />
            </div>
          </Tile>
        </div>

        {/* Audit rail */}
        <aside className="sticky top-[68px] flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-500">
                AUDIT TRAIL
              </div>
              <div className="mt-1 text-[12.5px] font-semibold text-hesya-navy-900">
                {t("auditRailTitle")}
              </div>
            </div>
            {/* Reference parity: refresh button → LIVE 표식 (pulsing dot). 30s
                unstable_cache 자체가 admin 입장 polling 역할이라 수동 새로고침
                버튼 의미 없음. */}
            <span
              aria-label="Live"
              className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-700"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
              />
              LIVE
            </span>
          </div>

          {audit.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-[#fafbfc] px-5 py-8 text-center text-[12.5px] text-gray-500">
              {t("auditEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-px">
              {audit.map((row, idx) => (
                <li
                  key={`${row.kind}:${row.id}`}
                  className={[
                    "relative rounded-md px-3 py-2.5 transition hover:bg-[#fafbfc]",
                    // Reference parity: fresh row = 2px left amber bar +
                    // slide-in animation (globals.css @keyframes
                    // adminAuditSlideIn). prefers-reduced-motion 자동 우회.
                    idx === 0
                      ? "admin-audit-fresh border-l-2 border-hesya-amber-500 pl-[10px]"
                      : "",
                  ].join(" ")}
                >
                  {/* Reference parity: 32px avatar | grid body | ts (admin-dashboard.css .ad-audit-row .av). */}
                  <div className="grid grid-cols-[32px_1fr_auto] items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={[
                        "grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-semibold uppercase",
                        row.kind === "kyc"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-hesya-danger-50 text-hesya-danger-600",
                      ].join(" ")}
                    >
                      {(row.summary?.trim()[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug text-hesya-navy-900">
                        {row.summary}
                      </p>
                      {row.context ? (
                        <p className="mt-0.5 truncate font-mono text-[10.5px] text-gray-500">
                          {row.context}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <time className="whitespace-nowrap font-mono text-[10.5px] text-gray-500">
                        {new Intl.DateTimeFormat(locale, {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Seoul",
                        }).format(row.occurredAt)}
                      </time>
                      <span
                        className={[
                          "font-body-en text-[9px] font-bold uppercase tracking-[0.18em]",
                          row.kind === "kyc"
                            ? "text-emerald-700"
                            : "text-hesya-danger-600",
                        ].join(" ")}
                      >
                        {row.kind === "kyc" ? "KYC" : "DIS"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Reference parity: audit foot (admin-dashboard.css 897~912).
              좌 카운트 + 우 정적 hint (별도 audit 페이지 미존재라 reference
              "전체 감사 로그 →" 링크 대신 30s 폴링 hint로 절충). */}
          {audit.length > 0 ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-1 pt-3 text-[11.5px] text-gray-500">
              <span className="text-hesya-navy-900">
                {t("auditFootCount", { n: audit.length })}
              </span>
              <span className="font-mono text-[10.5px]">
                {t("auditFootRefresh")}
              </span>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

/* ─── Helpers ─── */

function Tile({ span, children }: { span: number; children: React.ReactNode }) {
  // grid-column: span N (12-col bento).
  return (
    <section
      className={[
        "col-span-12 rounded-[10px] border border-gray-100 bg-white p-5",
        span === 3 ? "lg:col-span-6 xl:col-span-3" : "",
        span === 4 ? "lg:col-span-6 xl:col-span-4" : "",
        span === 6 ? "lg:col-span-12 xl:col-span-6" : "",
        span === 8 ? "lg:col-span-12 xl:col-span-8" : "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function TileHead({ labelEn, labelKr }: { labelEn: string; labelKr: string }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-2">
      <div>
        <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-500">
          {labelEn}
        </div>
        <div className="mt-1 text-[12.5px] font-semibold text-hesya-navy-900">
          {labelKr}
        </div>
      </div>
      <button
        type="button"
        aria-label="More"
        className="font-mono text-[11px] text-gray-400 transition hover:text-hesya-navy-900"
      >
        ⋯
      </button>
    </div>
  );
}

function KpiNum({
  value,
  unit,
  compact,
}: {
  value: string;
  unit?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "font-heading font-medium italic leading-none tracking-[-0.025em] text-hesya-navy-900",
        compact ? "text-[28px]" : "text-[44px]",
      ].join(" ")}
    >
      {value}
      {unit ? (
        <span className="ml-1 font-body-kr text-[18px] font-semibold not-italic text-gray-500">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

function KpiMeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-gray-500">
      {children}
    </div>
  );
}

function AlertChip({
  level,
  icon,
  label,
  count,
  href,
  meta,
}: {
  level: "crit" | "warn" | "budg" | "flag";
  icon: string;
  label: string;
  count: number;
  href: string;
  meta?: string;
}) {
  const clear = count === 0;
  const urgent = !clear && level === "crit" && count >= 5;

  const palette = clear
    ? {
        border: "border-emerald-200",
        bg: "bg-emerald-50/60",
        count: "text-emerald-700",
      }
    : {
        crit: {
          border: "border-hesya-danger-200",
          bg: "bg-hesya-danger-50",
          count: "text-hesya-danger-600",
        },
        warn: {
          border: "border-hesya-peach-200",
          bg: "bg-[#fbf1e6]",
          count: "text-hesya-amber-700",
        },
        budg: {
          border: "border-hesya-peach-200",
          bg: "bg-[#fbf1e6]",
          count: "text-hesya-amber-700",
        },
        flag: {
          border: "border-hesya-danger-200",
          bg: "bg-hesya-danger-50",
          count: "text-hesya-danger-600",
        },
      }[level];

  return (
    <Link
      href={href}
      className={[
        "inline-flex flex-shrink-0 items-center gap-2.5 rounded-md border bg-white px-3.5 py-2.5 transition hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(26,34,56,0.06)]",
        palette.border,
        palette.bg,
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-xs">
        {clear ? "🟢" : icon}
      </span>
      <span className="text-[12.5px] font-semibold text-hesya-navy-900">
        {label}
      </span>
      <span
        className={[
          "ml-1 inline-flex items-center gap-1 font-heading text-[16px] font-medium italic leading-none",
          palette.count,
        ].join(" ")}
      >
        {urgent && (
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-hesya-danger-600"
          />
        )}
        {clear ? "—" : count}
      </span>
      {!clear && meta && (
        <span className="ml-1 font-mono text-[10.5px] text-gray-500">
          · {meta}
        </span>
      )}
      <span className="ml-1 font-mono text-[11px] text-gray-500">→</span>
    </Link>
  );
}
