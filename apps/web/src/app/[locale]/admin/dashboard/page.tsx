/**
 * Plan v3 M4.3 — admin 통합 dashboard.
 *
 * 운영자 시점에서 가장 시급한 4가지 (KYC 검토 / 분쟁 / API 정책 알림 / 매장 삭제)
 * + 매장 상태 KPI 4개 + 최근 audit trail. 기존 admin sub-pages 8개로의 link hub
 * 역할도 겸함.
 *
 * 축소 scope (Phase 2 보류): Korea map / monthly bar chart / Top 5 카테고리.
 * AI cost는 M4.4 /admin/ai-cost에서 별도.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/shared/config/env";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import {
  getAdminAlertCounts,
  getAdminAuditTrail,
  getAdminKpiSummary,
} from "@/shared/lib/dal/admin-dashboard";
import { getCurrentMonthRange } from "@/shared/lib/dal/dashboard";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const monthRange = getCurrentMonthRange();
  const [alerts, kpi, audit] = await Promise.all([
    getAdminAlertCounts(db),
    getAdminKpiSummary(db, monthRange),
    getAdminAuditTrail(db, 20),
  ]);

  const t = await getTranslations({ locale, namespace: "AdminDashboard" });

  const kVerifiedPct =
    kpi.totalRegistered > 0
      ? Math.round((kpi.activeStores / kpi.totalRegistered) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-hesya-peach-50/30">
      <PageHeader
        eyebrow="Admin · Dashboard"
        title={t("title")}
        right={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
              LIVE
            </span>
            <p className="font-mono text-[11px] text-hesya-navy-900/60">
              {t("signedInAs", { email: guard.email })}
            </p>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Alert chips */}
        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
            {t("alertBand")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              level="info"
              icon="📣"
              label={t("alerts.newApiPolicyAlerts")}
              count={alerts.newApiPolicyAlerts}
              href={`/${locale}/admin/api-policy-alerts`}
            />
            <AlertChip
              level="info"
              icon="🗑"
              label={t("alerts.pendingStoreDeletions")}
              count={alerts.pendingStoreDeletions}
              href={`/${locale}/admin/store-deletion`}
            />
          </div>
        </section>

        {/* KPI tiles */}
        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
            {t("kpiBand")}
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile
              label={t("kpis.activeStores")}
              value={kpi.activeStores.toLocaleString("ko")}
              subtext={t("kpis.activeStoresSub", {
                total: kpi.totalRegistered,
              })}
            />
            <KpiTile
              label={t("kpis.kVerified")}
              value={`${kVerifiedPct}%`}
              subtext={t("kpis.kVerifiedSub", {
                active: kpi.activeStores,
                total: kpi.totalRegistered,
              })}
            />
            <KpiTile
              label={t("kpis.newStoresToday")}
              value={kpi.newStoresToday.toLocaleString("ko")}
              subtext={t("kpis.newStoresTodaySub")}
            />
            <KpiTile
              label={t("kpis.foreignGmv")}
              value={`₩${kpi.foreignGmvMtdKrw.toLocaleString("ko")}`}
              subtext={t("kpis.foreignGmvSub", {
                n: kpi.foreignBookingsMtd,
              })}
            />
          </div>
        </section>

        {/* Sub-pages link hub */}
        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
            {t("subPages")}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SubPageLink
              href={`/${locale}/admin/store-verifications`}
              label={t("links.kycQueue")}
            />
            <SubPageLink
              href={`/${locale}/admin/disputes`}
              label={t("links.disputes")}
            />
            <SubPageLink
              href={`/${locale}/admin/api-policy-alerts`}
              label={t("links.apiPolicyAlerts")}
            />
            <SubPageLink
              href={`/${locale}/admin/ai-accuracy`}
              label={t("links.aiAccuracy")}
            />
            <SubPageLink
              href={`/${locale}/admin/ai-cost`}
              label={t("links.aiCost")}
            />
            <SubPageLink
              href={`/${locale}/admin/store-reports`}
              label={t("links.storeReports")}
            />
            <SubPageLink
              href={`/${locale}/admin/store-deletion`}
              label={t("links.storeDeletion")}
            />
            <SubPageLink
              href={`/${locale}/admin/payment-monitoring`}
              label={t("links.paymentMonitoring")}
            />
            <SubPageLink
              href={`/${locale}/admin/kyc-test`}
              label={t("links.kycTest")}
            />
          </div>
        </section>

        {/* Audit trail */}
        <section>
          <h2 className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
            <span>{t("auditTrail")}</span>
            <span className="flex items-center gap-1 text-hesya-amber-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-hesya-amber-600" />
              LIVE
            </span>
          </h2>
          {audit.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-white/60 px-5 py-8 text-center text-[13px] text-hesya-navy-900/55">
              {t("auditEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-hesya-peach-100 rounded-md border border-gray-200 bg-white shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
              {audit.map((row) => (
                <li
                  key={`${row.kind}:${row.id}`}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      row.kind === "kyc"
                        ? "bg-hesya-amber-600/15 text-hesya-amber-600"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {row.kind}
                  </span>
                  <span className="flex-1 truncate text-[13px] text-hesya-navy-900">
                    {row.summary}
                    {row.context && (
                      <span className="ml-2 text-hesya-navy-900/55">
                        · {row.context}
                      </span>
                    )}
                  </span>
                  <time className="shrink-0 text-[11px] text-hesya-navy-900/45">
                    {new Intl.DateTimeFormat(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    }).format(row.occurredAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
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
  level: "crit" | "warn" | "info";
  icon: string;
  label: string;
  count: number;
  href: string;
}) {
  const colorMap = {
    crit: "border-[#e5c0ba] bg-[#faefec] hover:bg-[#f6e6e0]",
    warn: "border-hesya-peach-200 bg-[#fbf1e6] hover:bg-hesya-peach-100",
    info: "border-gray-200 bg-white hover:bg-hesya-peach-50",
  } as const;
  const countColor = {
    crit: "text-[#c9483a]",
    warn: "text-hesya-amber-700",
    info: "text-hesya-navy-900",
  } as const;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md border px-4 py-3 transition ${colorMap[level]}`}
    >
      <span aria-hidden="true" className="text-[18px]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
          {label}
        </div>
        <div
          className={`font-heading text-[26px] font-medium italic leading-none ${countColor[level]}`}
        >
          {count}
        </div>
      </div>
      <span className="text-[12px] text-hesya-navy-900/40">→</span>
    </Link>
  );
}

function KpiTile({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(26,34,56,0.04)] transition hover:border-hesya-amber-500/40">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {label}
      </div>
      <div className="mt-2 font-heading text-[28px] font-medium italic leading-none tracking-[-0.02em] text-hesya-navy-900">
        {value}
      </div>
      {subtext && (
        <div className="mt-1.5 text-[11px] text-gray-500">{subtext}</div>
      )}
    </div>
  );
}

function SubPageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-hesya-navy-900 transition hover:border-hesya-amber-500 hover:bg-hesya-peach-50"
    >
      {label} →
    </Link>
  );
}
