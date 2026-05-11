import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { StoreVerificationsList } from "@/features/admin";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { listStoresPendingReview } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C — admin KYC 검토 큐 (목록).
 *
 * 가드 실패 → /sign-in. listStoresPendingReview는
 * verification_status='manual_review' 매장만 반환.
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
  const rows = await listStoresPendingReview(db);

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
        매장 검토 큐
      </h1>
      <StoreVerificationsList rows={rows} />
    </main>
  );
}
