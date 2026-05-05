/**
 * Phase B-3c — 사장이 AIAssist 'OK' 클릭 → IG로 자동 송출.
 *
 * **흐름**:
 *   1. requireStoreOwnerAuth (세션)
 *   2. 메시지 조회 + conversation 조회 + ownership 검증 (claim 전)
 *   3. claimAiDraftForSend (status='ai_draft' → 'sending', race-safe)
 *   4. window 검증 / integration 조회 / recipient 조회 (실패 → revert)
 *   5. IG send (실패 → revert + Sentry + re-throw)
 *   6. markMessageSent (status='sending' → 'sent' + external_message_id)
 *   7. updateLastMessage + revalidatePath
 *
 * **MVP 결정**: `originalText`(한국어)만 발송. `translatedText`는 사장 검수용
 * 보조 표시. 향후 customerLanguage가 ko가 아닌 경우 translatedText 발송 옵션은
 * 별 Phase (디자인 결정 필요).
 *
 * **Race**: 동시 두 클릭 → claimAiDraftForSend 한 번만 row 반환,
 * 다른 호출은 null → ValidationError. IG send는 1회만 호출.
 *
 * **실패 정책**: IG send 실패 시 revert(status='ai_draft' 복원) — 사장이
 * 알림 보고 재시도 가능. status='failed' 영구 차단 대안은 사고 회복 느림.
 * Sentry alert로 운영 가시성 확보.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createDbClient, type Channel } from "@hesya/database";
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
} from "@/shared/lib/dal/messages";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import {
  ForbiddenError,
  ValidationError,
  WindowClosedError,
} from "@/shared/lib/errors";
import { acceptAiDraftInputSchema } from "../schema";

// 모듈 로드 시 1회. send-outbound.ts와 동일 — IG_APP_SECRET 변경 시 재시작 필요.
const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

export async function acceptAiDraft(input: {
  messageId: string;
}): Promise<{ ok: true; externalMessageId: string }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = acceptAiDraftInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }
    const { messageId } = parsed.data;

    const db = createDbClient(env.DATABASE_URL);
    const message = await findMessageById(db, messageId);
    if (!message) throw new ValidationError("메시지를 찾을 수 없습니다");

    const conv = await getConversationById(db, message.conversationId!);
    if (!conv) throw new ValidationError("대화를 찾을 수 없습니다");
    if (conv.storeId !== session.storeId) throw new ForbiddenError();

    // claim — 동시 두 클릭 시 한 트랜잭션만 row 반환 (L-058)
    const claimed = await claimAiDraftForSend(db, messageId);
    if (!claimed) {
      throw new ValidationError(
        "이미 처리된 초안입니다 (다른 곳에서 발송 중이거나 완료됨)",
      );
    }

    // claim 후 검증 — 실패 시 revert로 복원
    try {
      if (
        !conv.messagingWindowExpiresAt ||
        conv.messagingWindowExpiresAt.getTime() <= Date.now()
      ) {
        throw new WindowClosedError({
          conversationId: conv.id,
          expiresAt: conv.messagingWindowExpiresAt,
        });
      }

      // DB CHECK constraint(channel IN ...)이 허용값을 강제하므로 cast 안전.
      const channel = conv.channel as Channel;
      const integration = await getIntegration(db, session.storeId, channel);
      if (!integration) {
        throw new ValidationError("Instagram 연결이 없습니다");
      }

      const recipientExternalId = await getExternalIdByCustomerId(
        db,
        conv.customerId,
      );
      if (!recipientExternalId) {
        throw new ValidationError("고객 식별자 없음");
      }

      // originalText(한국어)를 발송. translatedText는 사장 검수용 보조 표시 (B-3a/B-3b 일관).
      const sent = await adapter.sendOutbound(
        {
          externalRecipientId: recipientExternalId,
          text: claimed.originalText!,
        },
        {
          accessToken: integration.accessToken,
          externalAccountId: integration.externalAccountId,
          externalPageId: integration.externalPageId ?? undefined,
        },
      );

      await markMessageSent(db, messageId, sent.externalMessageId);
      await updateLastMessage(db, conv.id, {
        preview: claimed.originalText!.slice(0, 80),
        at: new Date(),
      });

      revalidatePath(`/[locale]/store/inbox`, "page");
      return { ok: true as const, externalMessageId: sent.externalMessageId };
    } catch (innerErr) {
      // window expired / integration 없음 / IG send 실패 등 — claim 복원으로 사장 재시도 가능
      await revertAiDraftClaim(db, messageId);
      throw innerErr;
    }
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.acceptAiDraft",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
