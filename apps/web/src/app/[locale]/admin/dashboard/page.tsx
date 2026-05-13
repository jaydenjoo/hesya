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
 * Mock data 위젯(5): bar / spark / donut / map / top. Phase 2 진입 시 DAL 추가 후 wire.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import {
  getAdminAlertCounts,
  getAdminAuditTrail,
  getAdminKpiSummary,
} from "@/shared/lib/dal/admin-dashboard";
import { getCurrentMonthRange } from "@/shared/lib/dal/dashboard";

import { DashboardBarChart } from "@/features/admin/components/dashboard-bar-chart";
import { DashboardSpark } from "@/features/admin/components/dashboard-spark";
import { DashboardSlaDonut } from "@/features/admin/components/dashboard-sla-donut";
import { DashboardKoreaMap } from "@/features/admin/components/dashboard-korea-map";
import { DashboardTopCategories } from "@/features/admin/components/dashboard-top-categories";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // layout에서도 가드하지만 defense-in-depth — 직접 page 호출 시 차단.
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const monthRange = getCurrentMonthRange();
  const [alerts, kpi, audit] = await Promise.all([
    getAdminAlertCounts(db),
    getAdminKpiSummary(db, monthRange),
    getAdminAuditTrail(db, 12),
  ]);

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
        />
        <AlertChip
          level="warn"
          icon="🟡"
          label={t("alerts.openDisputes")}
          count={alerts.openDisputes}
          href={`/${locale}/admin/disputes`}
        />
        <AlertChip
          level="budg"
          icon="📣"
          label={t("alerts.newApiPolicyAlerts")}
          count={alerts.newApiPolicyAlerts}
          href={`/${locale}/admin/api-policy-alerts`}
        />
        <AlertChip
          level="flag"
          icon="🗑"
          label={t("alerts.pendingStoreDeletions")}
          count={alerts.pendingStoreDeletions}
          href={`/${locale}/admin/store-deletion`}
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
            <DashboardBarChart />
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="AI COST · DAILY" labelKr="AI 비용 · 일별" />
            <div className="font-heading text-[28px] font-medium italic leading-none tracking-[-0.025em] text-hesya-navy-900">
              <span className="mr-0.5 font-mono text-[12px] not-italic text-gray-500">
                ₩
              </span>
              28,420
            </div>
            <KpiMeta>30일 평균 대비 ▲ 7%</KpiMeta>
            <div className="mt-3">
              <DashboardSpark />
            </div>
          </Tile>

          <Tile span={3}>
            <TileHead labelEn="DISPUTE SLA" labelKr="분쟁 처리 SLA" />
            <DashboardSlaDonut />
          </Tile>

          {/* Row 3 — Korea map (8) + Top 5 (4) */}
          <Tile span={8}>
            <TileHead
              labelEn="REGIONAL DISTRIBUTION"
              labelKr="지역별 활성 매장 분포"
            />
            <DashboardKoreaMap />
          </Tile>

          <Tile span={4}>
            <TileHead
              labelEn="TOP CATEGORIES · 30D"
              labelKr="상위 5 카테고리"
            />
            <div className="mt-2">
              <DashboardTopCategories />
            </div>
          </Tile>
        </div>

        {/* Audit rail */}
        <aside className="sticky top-[68px] flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-500">
                AUDIT LOG
              </div>
              <div className="mt-1 text-[12.5px] font-semibold text-hesya-navy-900">
                {t("auditRailTitle")}
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border border-gray-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 transition hover:border-hesya-navy-900 hover:text-hesya-navy-900"
            >
              {t("auditRefresh")}
            </button>
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
                    idx === 0 ? "bg-hesya-peach-50/60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em]",
                        row.kind === "kyc"
                          ? "bg-hesya-amber-500/15 text-hesya-amber-700"
                          : "bg-rose-100 text-rose-700",
                      ].join(" ")}
                    >
                      {row.kind}
                    </span>
                    <time className="ml-auto font-mono text-[10px] text-gray-500">
                      {new Intl.DateTimeFormat(locale, {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      }).format(row.occurredAt)}
                    </time>
                    {idx === 0 ? (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                        {t("auditFresh")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-hesya-navy-900">
                    {row.summary}
                  </p>
                  {row.context ? (
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-gray-500">
                      {row.context}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
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
}: {
  level: "crit" | "warn" | "budg" | "flag";
  icon: string;
  label: string;
  count: number;
  href: string;
}) {
  const palette = {
    crit: {
      border: "border-[#e5c0ba]",
      bg: "bg-[#faefec]",
      count: "text-[#c9483a]",
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
      border: "border-[#e5c0ba]",
      bg: "bg-[#faefec]",
      count: "text-[#c9483a]",
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
        {icon}
      </span>
      <span className="text-[12.5px] font-semibold text-hesya-navy-900">
        {label}
      </span>
      <span
        className={[
          "ml-1 font-heading text-[16px] font-medium italic leading-none",
          palette.count,
        ].join(" ")}
      >
        {count}
      </span>
      <span className="ml-1 font-mono text-[11px] text-gray-500">→</span>
    </Link>
  );
}
