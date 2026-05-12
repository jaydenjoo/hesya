import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { CustomersManager } from "@/features/store-customers/customers-manager";
import type { CustomerRow } from "@/features/store-customers/types";
import { env } from "@/shared/config/env";
import { listCustomersByStore } from "@/shared/lib/dal/customers";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v3 M3.2 / Phase D3-C2 — 매장 외국인 손님 관리 (owner-side).
 *
 * 사장에게 메시지를 보낸 적이 있는 customer 표시. M2.6 customer-side 예약은
 * customers row 생성 X (M4.x에서 booker 통합 예정).
 */
export default async function StoreCustomersPage({
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
  const [rows, shell] = await Promise.all([
    listCustomersByStore(db, session.storeId),
    getOwnerShellData(),
  ]);
  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: "StoreCustomers" });

  const customerRows: CustomerRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    channel: r.channel,
    externalId: r.externalId,
    nationality: r.nationality,
    preferredLanguage: r.preferredLanguage,
    totalVisits: r.totalVisits,
    ltvKrw: r.ltvKrw,
    allergyNote: r.allergyNote,
    preferredDesigner: r.preferredDesigner,
  }));

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="bg-hesya-peach-50">
        <PageHeader
          eyebrow="Operator · Customers"
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="px-8 pb-10">
          <CustomersManager
            rows={customerRows}
            labels={{
              emptyText: t("emptyText"),
              filter: {
                searchPlaceholder: t("searchPlaceholder"),
                channelAll: t("channelAll"),
                languageAll: t("languageAll"),
                resultCount: t("resultCount"),
              },
              table: {
                columnName: t("columnName"),
                columnChannel: t("columnChannel"),
                columnLanguage: t("columnLanguage"),
                columnNationality: t("columnNationality"),
                columnVisits: t("columnVisits"),
                columnLtv: t("columnLtv"),
                columnAllergy: t("columnAllergyNote"),
                columnDesigner: t("columnPreferredDesigner"),
                columnAction: t("columnAction"),
                viewButton: t("viewButton"),
                unknownName: t("unknownName"),
                emptyDash: t("emptyDash"),
              },
              detail: {
                closeLabel: t("detailCloseLabel"),
                tabProfile: t("tabProfile"),
                tabNotes: t("tabNotes"),
                tabHistory: t("tabHistory"),
                tabTags: t("tabTags"),
                profileChannel: t("columnChannel"),
                profileLanguage: t("columnLanguage"),
                profileNationality: t("columnNationality"),
                profileVisits: t("columnVisits"),
                profileLtv: t("columnLtv"),
                profileExternalId: t("profileExternalId"),
                notesAllergyLabel: t("columnAllergyNote"),
                notesDesignerLabel: t("columnPreferredDesigner"),
                allergyPlaceholder: t("allergyPlaceholder"),
                preferredDesignerPlaceholder: t("preferredDesignerPlaceholder"),
                saveButton: t("saveButton"),
                cancelButton: t("cancelButton"),
                historyPlaceholder: t("historyPlaceholder"),
                tagsPlaceholder: t("tagsPlaceholder"),
                unknownName: t("unknownName"),
                emptyDash: t("emptyDash"),
              },
            }}
          />
        </div>
      </div>
    </OwnerShell>
  );
}
