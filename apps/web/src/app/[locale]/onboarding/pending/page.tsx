import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { PendingStatus } from "@/features/onboarding";
import { findStoreStatusByUserId } from "@/shared/lib/dal/store-owners";

type Status =
  | "manual_review"
  | "auto_approved"
  | "rejected"
  | "pending"
  | "session_expired";

function toStatus(raw: string | null | undefined): Status {
  switch (raw) {
    case "manual_review":
    case "auto_approved":
    case "rejected":
      return raw;
    default:
      return "pending";
  }
}

/**
 * Phase 1-β Task B — owner 검토 대기 페이지 (O2).
 *
 * 미인증 → /sign-in. store_owners row 없으면 → /onboarding/kyc.
 * 그 외 store.verification_status를 PendingStatus로 전달 (client polling).
 */
export default async function PendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const result = await findStoreStatusByUserId(db, session.user.id);

  if (!result) {
    redirect(`/${locale}/onboarding/kyc`);
  }

  return (
    <main
      data-testid="kyc-pending-page"
      className="min-h-screen bg-hesya-peach-50 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto max-w-xl">
        <header className="mb-6 space-y-1.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Onboarding · Pending
          </p>
          <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
            신청 접수
          </h1>
          <p className="kr text-[13px] text-gray-600">
            검토가 완료되면 결과를 안내드립니다. 페이지는 30초마다 자동
            갱신됩니다.
          </p>
        </header>
        <PendingStatus initialStatus={toStatus(result.verificationStatus)} />
      </div>
    </main>
  );
}
