import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import {
  ServiceAiProposalBand,
  type ServiceAiLabels,
} from "@/features/store-services/ai-proposals";
import {
  ServicesManager,
  type ServiceRow,
} from "@/features/store-services/services-manager";
import {
  mockServiceProposals,
  mockServiceProposalStats,
} from "@/lib/mock-fixtures/services-ai";
import { env } from "@/shared/config/env";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v3 M3.1 — 매장 시술 관리 (owner-side). 사장이 시술을 직접 등록·수정·
 * 삭제. customer-side `/c/store/[id]` 페이지에서 사용되는 데이터의 source.
 */
export default async function StoreServicesPage({
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
  const rows = await listServicesByStore(db, session.storeId);

  const t = await getTranslations({ locale, namespace: "StoreServices" });

  const initialRows: ServiceRow[] = rows.map((r) => ({
    id: r.id,
    nameKo: r.nameKo,
    nameEn: r.nameEn,
    nameJa: r.nameJa,
    nameZhCn: r.nameZhCn,
    nameZhTw: r.nameZhTw,
    nameVi: r.nameVi,
    priceKrw: r.priceKrw,
    durationMinutes: r.durationMinutes,
    category: r.category,
  }));

  const totalCount = initialRows.length;
  const fullyTranslatedCount = initialRows.filter(
    (r) => r.nameEn && r.nameJa && r.nameZhCn && r.nameZhTw && r.nameVi,
  ).length;
  const langCoveragePct =
    totalCount === 0
      ? 0
      : Math.round((fullyTranslatedCount / totalCount) * 100);
  const pendingTranslateCount = totalCount - fullyTranslatedCount;

  return (
    <div className="bg-hesya-peach-50">
      <PageHeader
        eyebrow="Operator · Services"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-hesya-peach-100 bg-hesya-peach-50/70 px-6 py-3 backdrop-blur-md sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
          <h2 className="font-heading text-[18px] font-semibold italic tracking-[-0.01em] text-hesya-navy-900">
            {t("title")}
          </h2>
          <span className="text-[12px] text-hesya-navy-900/55">
            {t("svMetaCount", { count: totalCount })}
          </span>
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-hesya-peach-200 sm:inline-block"
          />
          <div className="flex items-center gap-2 text-[11px] text-hesya-navy-900/55">
            <span>{t("svLangSummary")}</span>
            <div
              className="h-1 w-20 overflow-hidden rounded-full bg-hesya-peach-100"
              role="progressbar"
              aria-valuenow={langCoveragePct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="block h-full rounded-full bg-emerald-500"
                style={{ width: `${langCoveragePct}%` }}
              />
            </div>
            <span className="font-mono font-semibold text-hesya-navy-900">
              {langCoveragePct}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingTranslateCount > 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-hesya-amber-500 bg-hesya-amber-500/5 px-3 py-1.5 text-[12px] font-medium text-hesya-amber-600 transition hover:bg-hesya-amber-500/10"
            >
              {t("svPendingButton")}
              <span className="rounded-full bg-hesya-amber-500 px-1.5 py-px font-mono text-[10px] font-bold leading-none text-white">
                {pendingTranslateCount}
              </span>
            </button>
          ) : null}
          <a
            href="#service-add"
            className="inline-flex items-center gap-1 rounded-md bg-hesya-amber-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(166,113,11,0.2)] transition hover:bg-hesya-amber-600"
          >
            <span aria-hidden="true">✨</span> + {t("svPrimaryButton")}
          </a>
        </div>
      </div>
      <div className="px-8 pb-10">
        {env.MOCK_FIXTURES && (
          <ServiceAiProposalBand
            proposals={mockServiceProposals}
            stats={mockServiceProposalStats}
            labels={
              {
                bandTitle: t("aiBand.title"),
                bandSubtitle: t("aiBand.subtitle"),
                scannedFromMessages: t("aiBand.scanned"),
                lastScanLabel: t("aiBand.lastScan"),
                demandScore: t("aiBand.demandScore"),
                competitorAvg: t("aiBand.competitor"),
                projectedBookings: t("aiBand.projected"),
                evidenceTitle: t("aiBand.evidence"),
                suggestedPrice: t("aiBand.suggestedPrice"),
                minutesSuffix: t("aiBand.minutes"),
                perMonth: t("aiBand.perMonth"),
                badgeTrending: t("aiBand.badgeTrending"),
                badgeGap: t("aiBand.badgeGap"),
                badgeVip: t("aiBand.badgeVip"),
                actionAdd: t("aiBand.actionAdd"),
                actionDismiss: t("aiBand.actionDismiss"),
              } satisfies ServiceAiLabels
            }
          />
        )}
        <ServicesManager
          initialRows={initialRows}
          labels={{
            addButton: t("addButton"),
            editButton: t("editButton"),
            deleteButton: t("deleteButton"),
            emptyText: t("emptyText"),
            deleteConfirm: t("deleteConfirm"),
            allCategoryLabel: t("allCategoryLabel"),
            translatedLabel: t("translatedLabel"),
            servicesCount: t.raw("servicesCount") as string,
            requiredError: t("requiredError"),
            editor: {
              titleCreate: t("editorTitleCreate"),
              titleEdit: t("editorTitleEdit"),
              closeLabel: t("editorCloseLabel"),
              langTabKo: t("langTabKo"),
              langTabEn: t("langTabEn"),
              langTabJa: t("langTabJa"),
              langTabZhCn: t("langTabZhCn"),
              langTabZhTw: t("langTabZhTw"),
              langTabVi: t("langTabVi"),
              nameLabel: t("editorNameLabel"),
              aiSuggestLabel: t("editorAiSuggestLabel"),
              aiTranslateAllLabel: t("editorAiTranslateAllLabel"),
              aiSuggestNote: t("editorAiSuggestNote"),
              priceKrwLabel: t("priceKrwLabel"),
              durationLabel: t("durationLabel"),
              categoryLabel: t("categoryLabel"),
              categoryPlaceholder: t("editorCategoryPlaceholder"),
              complianceTitle: t("editorComplianceTitle"),
              complianceBody: t("editorComplianceBody"),
              saveButton: t("saveButton"),
              cancelButton: t("cancelButton"),
              requiredAsterisk: t("editorRequiredAsterisk"),
            },
          }}
        />
      </div>
    </div>
  );
}
