"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { sendKycNotification } from "@/lib/notifications/kyc-result";
import { shortId, track } from "@/shared/lib/analytics";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import { findOwnerNotifyTargetByStoreId } from "@/shared/lib/dal/store-owners";
import { rejectStore } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C + Phase 1-γ.1 + Phase 1-γ.2 — 운영자 KYC 거절 server action.
 *
 * `requireAdminRole` (DB `users.role='admin'`) 통과한 운영자가 manual_review
 * 매장을 거절. γ.2 첫 callsite 마이그 — `guard.userId`만 사용해서 envelope 호환.
 * `rejectStore` DAL이 stores.verification_status='rejected' +
 * store_verifications.reviewedBy/reviewedAt/rejectionReason을 단일
 * 트랜잭션으로 갱신.
 *
 * 거절 사유 3자 미만 → "reason_too_short" 사전 차단 (UI도 disable).
 *
 * Phase 1-γ.1: 트랜잭션 성공 후 owner email lookup + `manual_rejected` 알림
 * 발송. 본문에 admin이 적은 사유 + 재신청 URL 포함 (E9-13 actionable). 알림
 * 실패는 silent — 거절 자체는 성공으로 응답.
 *
 * 결과 envelope:
 *   - { ok: true } — 거절 + revalidatePath 완료 (알림은 silent)
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

/**
 * 재신청 URL — owner가 거절 알림 받으면 즉시 다음 행동을 취할 수 있게 함.
 * E9-13 패턴과 동일. NEXT_PUBLIC_APP_URL 기반 (prod/preview/dev 자동 분기).
 */
function buildRetryUrl(): string {
  return `${env.NEXT_PUBLIC_APP_URL}/onboarding/kyc`;
}

export async function rejectStoreKyc(input: {
  storeId: string;
  verificationId: string;
  reason: string;
}): Promise<RejectStoreKycResult> {
  const guard = await requireAdminRole();
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

    await track("kyc_rejected", shortId(guard.userId), {
      storeId: shortId(input.storeId),
      reasonLen: reason.length,
    });

    // Phase 1-γ.1: owner에게 거절 알림 (사유 + 재신청 URL 포함). 실패는 silent.
    // Locale "ko" hardcoded — approve-store-kyc.ts와 동일 사유.
    try {
      const target = await findOwnerNotifyTargetByStoreId(db, input.storeId);
      if (target) {
        await sendKycNotification({
          kind: "manual_rejected",
          to: target.email,
          storeName: target.storeName,
          locale: "ko",
          reason: {
            summary: reason,
            retryUrl: buildRetryUrl(),
          },
        });
      }
    } catch (notifyErr) {
      console.error(
        `[rejectStoreKyc] owner notify failed (storeId=${input.storeId}):`,
        notifyErr,
      );
    }

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
