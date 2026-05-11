import { notFound, redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { DisputeDetail } from "@/features/admin";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { getDispute } from "@/shared/lib/dal/disputes";

/**
 * Epic 12.4 — admin 분쟁 상세 + 처리 액션.
 *
 * 가드 실패 → /sign-in. 분쟁 미존재 → notFound.
 */
export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const dispute = await getDispute(db, id);
  if (!dispute) {
    notFound();
  }

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
        분쟁 상세
      </h1>
      <DisputeDetail dispute={dispute} />
    </main>
  );
}
