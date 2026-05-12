import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
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
    <main className="min-h-screen bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Store Verifications"
        title="매장 검토 큐"
        subtitle="신규 매장의 사업자 정보를 검토하고 KYC를 진행합니다."
      />
      <div className="mx-auto max-w-6xl px-8 pb-10">
        <StoreVerificationsList rows={rows} />
      </div>
    </main>
  );
}
