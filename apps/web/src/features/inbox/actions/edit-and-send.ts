/**
 * Phase 1-β Task D — pending_review 초안을 사장이 편집 후 전송.
 *
 * 흐름:
 *   1. requireStoreOwnerAuth + ownership 가드
 *   2. 검증: messageId UUID + newText 1..2000자
 *   3. message + conversation 조회 + storeId 일치 확인
 *   4. draftStatus === 'pending_review' 가드
 *   5. markDraftEdited(newText, edited_from_ai=true) — H1 수정률 분석 base
 *   6. updateDraftStatus → 'approved'
 *   7. claim → IG send → markMessageSent + draftStatus='sent'
 *   8. revalidatePath
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
  markDraftEdited,
  updateDraftStatus,
} from "@/shared/lib/dal/messages";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { shortId, track } from "@/shared/lib/analytics";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

const inputSchema = z.object({
  messageId: z.uuid(),
  newText: z.string().min(1).max(2000),
});

export type EditAndSendResult =
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

export async function editAndSend(input: {
  messageId: string;
  newText: string;
}): Promise<EditAndSendResult> {
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
  const { messageId, newText } = parsed.data;

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

    // 사장 편집본을 originalText에 저장 + edited_from_ai=true 마킹.
    // H1 학습 — Phase 1-β 종료 시 수정률 분포 분석 (Spec § 4.1 H1).
    await markDraftEdited(db, { messageId, newText });
    await updateDraftStatus(db, {
      messageId,
      nextStatus: "approved",
      reviewerId: session.userId,
    });

    const claimed = await claimAiDraftForSend(db, messageId);
    if (!claimed) return { ok: false, error: "invalid_state" };

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
        { externalRecipientId: recipientExternalId, text: newText },
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
        preview: newText.slice(0, 80),
        at: new Date(),
      });

      revalidatePath(`/[locale]/store/inbox`, "page");
      await track("ai_draft_edited", shortId(session.storeId), {
        userId: shortId(session.userId),
        chars: newText.length,
      });
      await track("message_sent", shortId(session.storeId), {
        userId: shortId(session.userId),
        source: "ai_draft_edit",
        chars: newText.length,
      });
      return { ok: true };
    } catch (innerErr) {
      await safeRevert(db, messageId, session);
      throw innerErr;
    }
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.editAndSend",
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
      tags: { phase: "editAndSend.revert" },
      extra: {
        messageId,
        userIdShort: ctx.userId.slice(0, 8),
        storeIdShort: ctx.storeId.slice(0, 8),
      },
    });
  }
}
