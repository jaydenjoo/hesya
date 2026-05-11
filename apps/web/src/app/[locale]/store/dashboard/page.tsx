import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { DashboardHeader, KpiGrid, type KpiEntry } from "@/features/dashboard";
import { env } from "@/shared/config/env";
import {
  getDisputeLoad,
  getInboxLoad,
  getKycStatus,
} from "@/shared/lib/dal/dashboard";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 4 (ε phase) — 매장 운영 대시보드.
 *
 * 가드 실패 → /sign-in. 실측 KPI 3개 + coming-soon placeholder 9개. Epic 2/3
 * 도입 후 placeholder는 별 PR로 활성화.
 *
 * **chrome 변경 0건**: 좌측 navigation 추가는 별 PR (E12 admin chrome과 동일
 * 패턴). 현재는 직접 URL 접근만.
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
  const [inbox, dispute, kyc] = await Promise.all([
    getInboxLoad(db, session.storeId),
    getDisputeLoad(db, session.storeId),
    getKycStatus(db, session.storeId),
  ]);

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const kycLabel = t(`kycStates.${kyc}` as const);

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
      value: "—",
      state: "coming-soon",
    },
    {
      key: "designerMix",
      label: t("kpis.designerMix"),
      value: "—",
      state: "coming-soon",
    },
  ];

  return (
    <main className="container py-12">
      <DashboardHeader title={t("title")} subtitle={t("subtitle")} />
      <KpiGrid entries={entries} comingSoonNote={t("comingSoonNote")} />
      <p className="mt-8 text-xs text-hesya-navy-900/55">{t("footerNote")}</p>
    </main>
  );
}
