import { notFound, redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Disputes · Detail"
        title="분쟁 상세"
        subtitle="접수된 분쟁을 검토하고 결과를 등록합니다."
      />
      <div className="mx-auto max-w-4xl px-8 pb-10">
        {/* eslint-disable-next-line react-hooks/purity */}
        <DisputeDetail dispute={dispute} nowMs={Date.now()} />
      </div>
    </div>
  );
}
