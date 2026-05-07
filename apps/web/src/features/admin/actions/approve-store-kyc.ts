"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { approveStore } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C — 운영자 KYC 승인 server action.
 *
 * `requireAdminEmail` 가드 통과한 운영자가 manual_review 매장을 승인.
 * Task A의 `approveStore` DAL 헬퍼가 stores + store_verifications 두
 * 테이블을 단일 트랜잭션으로 갱신 (한쪽만 갱신되면 admin 큐 mismatch).
 *
 * 자동 검증(OCR / NTS / LOCALDATA) 호출은 scope OUT — 운영자 육안 검토만.
 *
 * 결과 envelope:
 *   - { ok: true } — 승인 + revalidatePath 완료
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
