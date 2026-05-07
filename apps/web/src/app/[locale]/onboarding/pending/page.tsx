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
    <main className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">신청 접수</h1>
      <PendingStatus initialStatus={toStatus(result.verificationStatus)} />
    </main>
  );
}
