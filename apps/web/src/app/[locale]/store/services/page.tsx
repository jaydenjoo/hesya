import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

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
  const rows = await listServicesByStore(db, session.storeId);

  const t = await getTranslations({ locale, namespace: "StoreServices" });

  const initialRows: ServiceRow[] = rows.map((r) => ({
    id: r.id,
    nameKo: r.nameKo,
    nameEn: r.nameEn,
    nameJa: r.nameJa,
    priceKrw: r.priceKrw,
    durationMinutes: r.durationMinutes,
    category: r.category,
  }));

  return (
    <main className="container py-12">
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-hesya-navy-900">
          {t("title")}
        </h1>
        <p className="text-sm text-hesya-navy-900/65">{t("subtitle")}</p>
      </header>

      <ServicesManager
        initialRows={initialRows}
        labels={{
          addButton: t("addButton"),
          cancelButton: t("cancelButton"),
          saveButton: t("saveButton"),
          editButton: t("editButton"),
          deleteButton: t("deleteButton"),
          nameKoLabel: t("nameKoLabel"),
          nameEnLabel: t("nameEnLabel"),
          nameJaLabel: t("nameJaLabel"),
          priceKrwLabel: t("priceKrwLabel"),
          durationLabel: t("durationLabel"),
          categoryLabel: t("categoryLabel"),
          emptyText: t("emptyText"),
          deleteConfirm: t("deleteConfirm"),
        }}
      />
    </main>
  );
}
