/**
 * Phase 1-β Task D — pending_review 초안을 승인 후 IG 발송.
 *
 * 흐름:
 *   1. requireStoreOwnerAuth (세션 + ownership 가드)
 *   2. findMessageById → null/conversation 미존재 시 not_found
 *   3. ownership 재검증 — message.storeId === session.storeId
 *   4. draftStatus 가드 — 'pending_review' 이외 invalid_state
 *   5. updateDraftStatus → 'approved' (감사 로그용 reviewedBy 기록)
 *   6. sendOutbound 직접 IG send 흐름 재사용 (claim/markSent 자체 처리)
 *   7. updateDraftStatus → 'sent' (최종 상태)
 *   8. revalidatePath
 *
 * accept-ai-draft.ts와의 차이:
 *   - accept-ai-draft는 status='ai_draft' 기반 (Phase B-3c, bot_mode=true legacy)
 *   - approve-draft는 draft_status='pending_review' 기반 (Phase 1-β review 모드)
 *   - 둘 다 internally claimAiDraftForSend → markMessageSent 동일 race-safe 흐름
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDbClient, type Channel } from "@hesya/database";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  getConversationById,
  updateLastMessage,
} from "@/shared/lib/dal/conversations";
import {
  findMessageById,
  claimAiDraftForSend,
  markMessageSent,
  revertAiDraftClaim,
  updateDraftStatus,
} from "@/shared/lib/dal/messages";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

const inputSchema = z.object({
  messageId: z.uuid(),
});

export type ApproveDraftResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "validation"
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "invalid_state"
        | "send_failed";
    };

export async function approveDraft(input: {
  messageId: string;
}): Promise<ApproveDraftResult> {
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
    if (!message || !message.conversationId) {
      return { ok: false, error: "not_found" };
    }
    if (!message.storeId || message.storeId !== session.storeId) {
      return { ok: false, error: "forbidden" };
    }
    if (message.draftStatus !== "pending_review") {
      return { ok: false, error: "invalid_state" };
    }

    const conv = await getConversationById(db, message.conversationId);
    if (!conv) return { ok: false, error: "not_found" };
    if (conv.storeId !== session.storeId) {
      return { ok: false, error: "forbidden" };
    }

    // 'approved' 마킹 — 감사 로그 (reviewedBy). 이후 IG send 성공 시 'sent'로 전환.
    await updateDraftStatus(db, {
      messageId,
      nextStatus: "approved",
      reviewerId: session.userId,
    });

    // race-safe claim (status: ai_draft → sending). 동시 클릭 두 번 시 한쪽만 통과.
    const claimed = await claimAiDraftForSend(db, messageId);
    if (!claimed || !claimed.originalText) {
      return { ok: false, error: "invalid_state" };
    }

    try {
      if (
        !conv.messagingWindowExpiresAt ||
        conv.messagingWindowExpiresAt.getTime() <= Date.now()
      ) {
        await safeRevert(db, messageId, session);
        return { ok: false, error: "send_failed" };
      }

      const channel = conv.channel as Channel;
      const integration = await getIntegration(db, session.storeId, channel);
      if (!integration) {
        await safeRevert(db, messageId, session);
        return { ok: false, error: "send_failed" };
      }

      const recipientExternalId = await getExternalIdByCustomerId(
        db,
        conv.customerId,
      );
      if (!recipientExternalId) {
        await safeRevert(db, messageId, session);
        return { ok: false, error: "send_failed" };
      }

      const sent = await adapter.sendOutbound(
        {
          externalRecipientId: recipientExternalId,
          text: claimed.originalText,
        },
        {
          accessToken: integration.accessToken,
          externalAccountId: integration.externalAccountId,
          externalPageId: integration.externalPageId ?? undefined,
        },
      );

      await markMessageSent(db, messageId, sent.externalMessageId);
      await updateDraftStatus(db, {
        messageId,
        nextStatus: "sent",
        reviewerId: session.userId,
      });
      await updateLastMessage(db, conv.id, {
        preview: claimed.originalText.slice(0, 80),
        at: new Date(),
      });

      revalidatePath(`/[locale]/store/inbox`, "page");
      return { ok: true };
    } catch (innerErr) {
      await safeRevert(db, messageId, session);
      throw innerErr;
    }
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.approveDraft",
      userId: session.userId,
      storeId: session.storeId,
    });
    return { ok: false, error: "send_failed" };
  }
}

async function safeRevert(
  db: ReturnType<typeof createDbClient>,
  messageId: string,
  ctx: { userId: string; storeId: string },
): Promise<void> {
  try {
    await revertAiDraftClaim(db, messageId);
  } catch (revertErr) {
    Sentry.captureException(revertErr, {
      tags: { phase: "approveDraft.revert" },
      extra: {
        messageId,
        userIdShort: ctx.userId.slice(0, 8),
        storeIdShort: ctx.storeId.slice(0, 8),
      },
    });
  }
}
