import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { StoreVerificationsList } from "@/features/admin";
import {
  KycQueueList,
  KycQueueStats,
  type KycQueueLabels,
} from "@/features/admin/components/kyc-queue-mock";
import { mockKycQueue, mockKycQueueStats } from "@/lib/mock-fixtures/admin-kyc";
import { env } from "@/shared/config/env";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { listStoresPendingReview } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C + Sprint 2C PR-D2 — admin KYC operator review queue.
 *
 * env.MOCK_FIXTURES=true 일 때 8건 mock queue + 통계 패널 노출.
 * 실 DAL (`listStoresPendingReview`)도 동시 노출 (prod 데이터가 0건이라도 fallback list).
 *
 * 가드 실패 → /sign-in.
 */
export default async function StoreVerificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const [rows, t] = await Promise.all([
    listStoresPendingReview(db),
    getTranslations({ locale, namespace: "AdminKycQueue" }),
  ]);

  const queueLabels: KycQueueLabels = {
    statsPending: t("statsPending"),
    statsSlaBreached: t("statsSlaBreached"),
    statsAvgRisk: t("statsAvgRisk"),
    statsToday: t("statsToday"),
    statsApproved: t("statsApproved"),
    statsRejected: t("statsRejected"),
    statsAutoApproved: t("statsAutoApproved"),
    riskLow: t("riskLow"),
    riskMedium: t("riskMedium"),
    riskHigh: t("riskHigh"),
    slaRemaining: t("slaRemaining"),
    slaBreached: t("slaBreachedShort"),
    docStatus: {
      ok: t("docStatus.ok"),
      blurry: t("docStatus.blurry"),
      expired: t("docStatus.expired"),
      missing: t("docStatus.missing"),
    },
    aiHintsTitle: t("aiHintsTitle"),
    priorIncidentsTitle: t("priorIncidentsTitle"),
    actionApprove: t("actionApprove"),
    actionReject: t("actionReject"),
    actionRequestMore: t("actionRequestMore"),
  };

  return (
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Store Verifications"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="mx-auto max-w-6xl px-8 pb-10">
        {env.MOCK_FIXTURES && (
          <>
            <KycQueueStats stats={mockKycQueueStats} labels={queueLabels} />
            <KycQueueList items={mockKycQueue} labels={queueLabels} />

            <div className="mt-10 mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
                {t("realDataSection")}
              </span>
              <span className="h-px flex-1 bg-hesya-navy-900/8" />
            </div>
          </>
        )}
        <StoreVerificationsList rows={rows} />
      </div>
    </div>
  );
}
