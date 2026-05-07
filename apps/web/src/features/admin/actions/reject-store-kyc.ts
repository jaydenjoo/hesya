"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { rejectStore } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C — 운영자 KYC 거절 server action.
 *
 * `requireAdminEmail` 통과한 운영자가 manual_review 매장을 거절.
 * `rejectStore` DAL이 stores.verification_status='rejected' +
 * store_verifications.reviewedBy/reviewedAt/rejectionReason을 단일
 * 트랜잭션으로 갱신.
 *
 * 거절 사유 3자 미만 → "reason_too_short" 사전 차단 (UI도 disable).
 *
 * 결과 envelope:
 *   - { ok: true } — 거절 + revalidatePath 완료
 *   - { ok: false, error: "unauthorized" | "forbidden" } — 가드 실패
 *   - { ok: false, error: "reason_too_short" } — 사유 너무 짧음
 *   - { ok: false, error: "internal" } — 트랜잭션 실패
 */
export type RejectStoreKycResult =
  | { ok: true }
  | {
      ok: false;
      error: "unauthorized" | "forbidden" | "reason_too_short" | "internal";
    };

export async function rejectStoreKyc(input: {
  storeId: string;
  verificationId: string;
  reason: string;
}): Promise<RejectStoreKycResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }
  const reason = input.reason.trim();
  if (reason.length < 3) {
    return { ok: false, error: "reason_too_short" };
  }
  try {
    const db = createDbClient(env.DATABASE_URL);
    await rejectStore(db, {
      storeId: input.storeId,
      verificationId: input.verificationId,
      reviewerId: guard.userId,
      reason,
    });
    revalidatePath("/admin/store-verifications");
    return { ok: true };
  } catch (err) {
    captureServerActionError(err, {
      action: "admin.rejectStoreKyc",
      userId: guard.userId,
      storeId: input.storeId,
    });
    return { ok: false, error: "internal" };
  }
}
