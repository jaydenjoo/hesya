import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { OwnerDisputesList } from "@/features/disputes";
import { listDisputesByStore } from "@/shared/lib/dal/disputes";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 12.4 — 사장 측 분쟁 목록 페이지.
 *
 * 인증 실패 → /sign-in. 본인 매장 분쟁만 표시 (storeId 가드).
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
  const rows = await listDisputesByStore(db, session.storeId);

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">분쟁 처리</h1>
      <OwnerDisputesList rows={rows} />
    </main>
  );
}
