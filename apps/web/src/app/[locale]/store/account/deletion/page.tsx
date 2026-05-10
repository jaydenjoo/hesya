import { redirect } from "next/navigation";

import { createDbClient } from "@hesya/database";

import { OwnerDeletionPanel } from "@/features/store-deletion";
import { env } from "@/shared/config/env";
import { getActiveDeletionRequest } from "@/shared/lib/dal/store-deletion";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * E12-9 — 사장 자가해지 페이지 (PRD §1068, SLA 30일 grace).
 *
 * 인증 실패 → /sign-in. 활성 요청 있으면 D-N 카운터 + 취소 버튼,
 * 없으면 신청 폼.
 */
export default async function StoreAccountDeletionPage({
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
  const active = await getActiveDeletionRequest(db, session.storeId);

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">매장 해지 / 데이터 삭제</h1>
      <OwnerDeletionPanel
        active={
          active
            ? {
                scheduledPurgeAt: active.scheduledPurgeAt.toISOString(),
                createdAt: active.createdAt.toISOString(),
                reason: active.reason,
              }
            : null
        }
      />
    </main>
  );
}
