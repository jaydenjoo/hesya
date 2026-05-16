"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { sendKycNotification } from "@/lib/notifications/kyc-result";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { findOwnerNotifyTargetByStoreId } from "@/shared/lib/dal/store-owners";
import { approveStore } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C + Phase 1-γ.1 — 운영자 KYC 승인 server action.
 *
 * `requireAdminEmail` 가드 통과한 운영자가 manual_review 매장을 승인.
 * Task A의 `approveStore` DAL 헬퍼가 stores + store_verifications 두
 * 테이블을 단일 트랜잭션으로 갱신 (한쪽만 갱신되면 admin 큐 mismatch).
 *
 * Phase 1-γ.1: 트랜잭션 성공 후 owner email lookup + `manual_approved` 알림 발송.
 * 알림 실패는 silent (console.error만) — 승인 자체는 성공으로 응답 (KYC 결과
 * 우선, 알림은 best-effort).
 *
 * 자동 검증(OCR / NTS / LOCALDATA) 호출은 scope OUT — 운영자 육안 검토만.
 *
 * 결과 envelope:
 *   - { ok: true } — 승인 + revalidatePath 완료 (알림은 silent)
 *   - { ok: false, error: "unauthorized" | "forbidden" } — 가드 실패
 *   - { ok: false, error: "internal" } — 트랜잭션 실패
 */
export type ApproveStoreKycResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "forbidden" | "internal" };

export async function approveStoreKyc(input: {
  storeId: string;
  verificationId: string;
}): Promise<ApproveStoreKycResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }
  try {
    const db = createDbClient(env.DATABASE_URL);
    await approveStore(db, {
      storeId: input.storeId,
      verificationId: input.verificationId,
      reviewerId: guard.userId,
    });
    revalidatePath("/admin/store-verifications");

    // Phase 1-γ.1: owner에게 승인 알림. 실패는 silent — 승인은 성공으로 응답.
    // Locale "ko" hardcoded — Phase 1 owner는 한국 사업자 (외국인 owner는 Phase 2).
    // users.preferredLocale 컬럼 도입 시 자연 교체 (DAL select에 추가).
    try {
      const target = await findOwnerNotifyTargetByStoreId(db, input.storeId);
      if (target) {
        await sendKycNotification({
          kind: "manual_approved",
          to: target.email,
          storeName: target.storeName,
          locale: "ko",
        });
      }
    } catch (notifyErr) {
      console.error(
        `[approveStoreKyc] owner notify failed (storeId=${input.storeId}):`,
        notifyErr,
      );
    }

    return { ok: true };
  } catch (err) {
    captureServerActionError(err, {
      action: "admin.approveStoreKyc",
      userId: guard.userId,
      storeId: input.storeId,
    });
    return { ok: false, error: "internal" };
  }
}
