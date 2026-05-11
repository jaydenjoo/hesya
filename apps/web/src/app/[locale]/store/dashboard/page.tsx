import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  DashboardHeader,
  DistributionPie,
  KpiGrid,
  type DistributionSlice,
  type KpiEntry,
} from "@/features/dashboard";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { env } from "@/shared/config/env";
import {
  countBookingsByService,
  countBookingsByStaff,
} from "@/shared/lib/dal/bookings";
import {
  getCurrentMonthRange,
  getDisputeLoad,
  getInboxLoad,
  getKycStatus,
} from "@/shared/lib/dal/dashboard";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 4 (ε phase) / Phase D4-D1 — 매장 운영 대시보드.
 *
 * 가드 실패 → /sign-in. 실측 KPI 5개 (미응답 / 분쟁 / KYC / 시술 분포 /
 * 디자이너 분포) + coming-soon placeholder 5개. Epic 2 결제 도입 후 매출·객단가·
 * 재방문률·노쇼율, ζ 베타 매칭 후 국적 분포가 활성화.
 *
 * D4-D1: OwnerShell wrap + 디자인 정합 header / KPI card 재구성.
 */
export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const monthRange = getCurrentMonthRange();
  const [
    inbox,
    dispute,
    kyc,
    serviceCounts,
    staffCounts,
    servicesList,
    staffList,
    shell,
  ] = await Promise.all([
    getInboxLoad(db, session.storeId),
    getDisputeLoad(db, session.storeId),
    getKycStatus(db, session.storeId),
    countBookingsByService(db, session.storeId, monthRange),
    countBookingsByStaff(db, session.storeId, monthRange),
    listServicesByStore(db, session.storeId),
    listStaffByStore(db, session.storeId),
    getOwnerShellData(),
  ]);

  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const kycLabel = t(`kycStates.${kyc}` as const);

  const serviceNameMap = new Map(
    servicesList.map((s) => [s.id, s.nameKo] as const),
  );
  const staffNameMap = new Map(staffList.map((s) => [s.id, s.name] as const));

  const treatmentSlices: ReadonlyArray<DistributionSlice> = serviceCounts.map(
    (c) => ({ label: serviceNameMap.get(c.key) ?? "—", value: c.count }),
  );
  const designerSlices: ReadonlyArray<DistributionSlice> = staffCounts.map(
    (c) => ({ label: staffNameMap.get(c.key) ?? "—", value: c.count }),
  );

  const treatmentTotal = treatmentSlices.reduce((sum, s) => sum + s.value, 0);
  const designerTotal = designerSlices.reduce((sum, s) => sum + s.value, 0);

  const entries: ReadonlyArray<KpiEntry> = [
    {
      key: "inboxUnread",
      label: t("kpis.inboxUnread"),
      value: String(inbox.unreadMessages),
      unit: t("units.count"),
      state: "active",
      subtext: `${inbox.openThreads} ${t("kpis.inboxThreads")}`,
    },
    {
      key: "disputesActive",
      label: t("kpis.disputesActive"),
      value: String(dispute.active),
      unit: t("units.count"),
      state: "active",
      subtext:
        dispute.slaExceeded > 0
          ? `${t("kpis.disputesSla")}: ${dispute.slaExceeded}`
          : undefined,
    },
    {
      key: "kycStatus",
      label: t("kpis.kycStatus"),
      value: kycLabel,
      state: "active",
    },
    {
      key: "monthlyRevenue",
      label: t("kpis.monthlyRevenue"),
      value: "—",
      unit: t("units.won"),
      state: "coming-soon",
    },
    {
      key: "averageOrder",
      label: t("kpis.averageOrder"),
      value: "—",
      unit: t("units.won"),
      state: "coming-soon",
    },
    {
      key: "rebookRate",
      label: t("kpis.rebookRate"),
      value: "—",
      unit: t("units.percent"),
      state: "coming-soon",
    },
    {
      key: "noShowRate",
      label: t("kpis.noShowRate"),
      value: "—",
      unit: t("units.percent"),
      state: "coming-soon",
    },
    {
      key: "nationalityMix",
      label: t("kpis.nationalityMix"),
      value: "—",
      state: "coming-soon",
    },
    {
      key: "treatmentMix",
      label: t("kpis.treatmentMix"),
      value: String(treatmentTotal),
      unit: t("units.count"),
      state: "active",
      chart: <DistributionPie data={treatmentSlices} />,
    },
    {
      key: "designerMix",
      label: t("kpis.designerMix"),
      value: String(designerTotal),
      unit: t("units.count"),
      state: "active",
      chart: <DistributionPie data={designerSlices} />,
    },
  ];

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <DashboardHeader title={t("title")} subtitle={t("subtitle")} />
        <KpiGrid entries={entries} comingSoonNote={t("comingSoonNote")} />
        <p className="mt-8 text-[11px] text-hesya-navy-900/55">
          {t("footerNote")}
        </p>
      </div>
    </OwnerShell>
  );
}
