import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import {
  ServicesManager,
  type ServiceRow,
} from "@/features/store-services/services-manager";
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
  const [rows, shell] = await Promise.all([
    listServicesByStore(db, session.storeId),
    getOwnerShellData(),
  ]);
  if (!shell) redirect(`/${locale}/sign-in`);

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

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="bg-hesya-peach-50">
        <PageHeader
          eyebrow="Operator · Services"
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="px-8 pb-10">
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
              servicesCount: t("servicesCount"),
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
    </OwnerShell>
  );
}
