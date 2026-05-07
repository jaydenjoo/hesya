import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { findStoreStatusByUserId } from "@/shared/lib/dal/store-owners";

/**
 * Phase 1-β Task B — owner KYC 검토 상태 폴링 endpoint.
 *
 * `/onboarding/pending` 페이지가 30초 간격으로 호출. session 없으면 401.
 * store_owners row 없으면 'no_application' (신청 전 상태).
 *
 * 자동 검증 미사용 — 'manual_review' / 'auto_approved' / 'rejected' /
 * 'pending' 중 하나가 stores.verification_status에서 그대로 반환.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const db = createDbClient(env.DATABASE_URL);
  const result = await findStoreStatusByUserId(db, session.user.id);

  if (!result) {
    return NextResponse.json({ ok: true, status: "no_application" });
  }

  return NextResponse.json({
    ok: true,
    status: result.verificationStatus ?? "pending",
    storeId: result.storeId,
  });
}
