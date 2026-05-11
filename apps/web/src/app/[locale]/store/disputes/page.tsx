import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

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
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Operator · Disputes
          </p>
          <h1 className="font-heading text-3xl font-semibold italic tracking-tight text-hesya-navy-900">
            분쟁 처리
          </h1>
          <p className="text-sm text-hesya-navy-900/65">
            손님과의 분쟁을 추적하고 응답합니다.
          </p>
        </header>
        <OwnerDisputesList rows={rows} />
      </div>
    </OwnerShell>
  );
}
