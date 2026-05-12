import { redirect } from "next/navigation";

import { createDbClient } from "@hesya/database";

import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { OwnerDeletionPanel } from "@/features/store-deletion";
import { env } from "@/shared/config/env";
import { getActiveDeletionRequest } from "@/shared/lib/dal/store-deletion";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * E12-9 / Phase D4-D4 — 사장 자가해지 페이지 (PRD §1068, SLA 30일 grace).
 *
 * OwnerShell wrap + header pattern. 인증 실패 → /sign-in. 활성 요청 있으면
 * D-N 카운터 + 취소 버튼, 없으면 신청 폼.
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
  const [active, shell] = await Promise.all([
    getActiveDeletionRequest(db, session.storeId),
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
        <div className="mx-auto max-w-3xl px-6 py-10">
          <header className="mb-6 space-y-1.5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
              Operator · Account · Deletion
            </p>
            <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
              매장 해지 / 데이터 삭제
            </h1>
            <p className="kr text-[13px] text-gray-600">
              매장 해지 후 30일간 grace 기간이 부여되며, 그 후 모든 데이터가
              영구 삭제됩니다.
            </p>
          </header>
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
        </div>
      </div>
    </OwnerShell>
  );
}
