import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import {
  CustomersList,
  type CustomerRow,
} from "@/features/store-customers/customers-list";
import { env } from "@/shared/config/env";
import { listCustomersByStore } from "@/shared/lib/dal/customers";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v3 M3.2 — 매장 외국인 손님 list (owner-side).
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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Operator · Customers
          </p>
          <h1 className="font-heading text-3xl font-semibold italic tracking-tight text-hesya-navy-900">
            {t("title")}
          </h1>
          <p className="text-sm text-hesya-navy-900/65">{t("subtitle")}</p>
        </header>

        <CustomersList
          rows={customerRows}
          labels={{
            columnName: t("columnName"),
            columnChannel: t("columnChannel"),
            columnLanguage: t("columnLanguage"),
            columnVisits: t("columnVisits"),
            columnLtv: t("columnLtv"),
            columnAllergyNote: t("columnAllergyNote"),
            columnPreferredDesigner: t("columnPreferredDesigner"),
            emptyText: t("emptyText"),
            editButton: t("editButton"),
            saveButton: t("saveButton"),
            cancelButton: t("cancelButton"),
            allergyPlaceholder: t("allergyPlaceholder"),
            preferredDesignerPlaceholder: t("preferredDesignerPlaceholder"),
            unknownName: t("unknownName"),
          }}
        />
      </div>
    </OwnerShell>
  );
}
