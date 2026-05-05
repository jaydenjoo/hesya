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
import { insertMessage } from "@/shared/lib/dal/messages";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import {
  ForbiddenError,
  ValidationError,
  WindowClosedError,
} from "@/shared/lib/errors";
import { sendOutboundInputSchema } from "../schema";

// 모듈 로드 시 1회. IG_APP_SECRET 변경 시 서버 재시작 필요.
const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

export async function sendOutbound(input: {
  conversationId: string;
  text: string;
}): Promise<{ ok: true; messageId: string }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = sendOutboundInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    const conv = await getConversationById(db, parsed.data.conversationId);
    if (!conv) throw new ValidationError("대화를 찾을 수 없습니다");
    if (conv.storeId !== session.storeId) throw new ForbiddenError();

    if (
      !conv.messagingWindowExpiresAt ||
      conv.messagingWindowExpiresAt.getTime() <= Date.now()
    ) {
      throw new WindowClosedError({
        conversationId: parsed.data.conversationId,
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

    const sent = await adapter.sendOutbound(
      { externalRecipientId: recipientExternalId, text: parsed.data.text },
      {
        accessToken: integration.accessToken,
        externalAccountId: integration.externalAccountId,
        externalPageId: integration.externalPageId ?? undefined,
      },
    );

    await insertMessage(db, {
      conversationId: conv.id,
      channel,
      direction: "outbound",
      originalText: parsed.data.text,
      externalMessageId: sent.externalMessageId,
      status: "sent",
    });
    await updateLastMessage(db, conv.id, {
      preview: parsed.data.text.slice(0, 80),
      at: new Date(),
    });

    revalidatePath(`/[locale]/store/inbox`, "page");
    return { ok: true as const, messageId: sent.externalMessageId };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.sendOutbound",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
