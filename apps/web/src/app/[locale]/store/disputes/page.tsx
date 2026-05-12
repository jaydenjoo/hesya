import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { OwnerDisputesList } from "@/features/disputes";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { env } from "@/shared/config/env";
import { listDisputesByStore } from "@/shared/lib/dal/disputes";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 12.4 / Phase D4-D4 — 사장 측 분쟁 목록 페이지. OwnerShell wrap.
 */
export default async function StoreDisputesPage({
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
    listDisputesByStore(db, session.storeId),
    getOwnerShellData(),
  ]);

  if (!shell) redirect(`/${locale}/sign-in`);

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="bg-hesya-peach-50">
        <PageHeader
          eyebrow="Operator · Disputes"
          title="분쟁 처리"
          subtitle="손님과의 분쟁을 추적하고 응답합니다."
        />
        <div className="mx-auto max-w-5xl px-8 pb-10">
          <OwnerDisputesList rows={rows} />
        </div>
      </div>
    </OwnerShell>
  );
}
