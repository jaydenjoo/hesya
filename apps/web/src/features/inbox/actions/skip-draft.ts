/**
 * Phase 1-β Task D — pending_review 초안을 무시 (전송 안 함).
 *
 * 흐름:
 *   1. requireStoreOwnerAuth + ownership 가드
 *   2. message + storeId 일치 검증
 *   3. draftStatus === 'pending_review' 가드
 *   4. updateDraftStatus → 'skipped' (감사 로그 reviewedBy 기록)
 *   5. revalidatePath
 *
 * IG send 없음. message는 status='ai_draft'로 남고 draftStatus='skipped' 상태.
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { findMessageById, updateDraftStatus } from "@/shared/lib/dal/messages";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

const inputSchema = z.object({
  messageId: z.uuid(),
});

export type SkipDraftResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "validation"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "invalid_state";
    };

export async function skipDraft(input: {
  messageId: string;
}): Promise<SkipDraftResult> {
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return { ok: false, error: "unauthorized" };
    if (err instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    throw err;
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const { messageId } = parsed.data;

  try {
    const db = createDbClient(env.DATABASE_URL);
    const message = await findMessageById(db, messageId);
    if (!message) return { ok: false, error: "not_found" };
    if (!message.storeId || message.storeId !== session.storeId) {
      return { ok: false, error: "forbidden" };
    }
    if (message.draftStatus !== "pending_review") {
      return { ok: false, error: "invalid_state" };
    }

    await updateDraftStatus(db, {
      messageId,
      nextStatus: "skipped",
      reviewerId: session.userId,
    });

    revalidatePath(`/[locale]/store/inbox`, "page");
    return { ok: true };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.skipDraft",
      userId: session.userId,
      storeId: session.storeId,
    });
    return { ok: false, error: "invalid_state" };
  }
}
