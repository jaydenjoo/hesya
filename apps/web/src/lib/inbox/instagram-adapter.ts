import { createHmac, timingSafeEqual } from "node:crypto";
import { WebhookSignatureError } from "@/shared/lib/errors";
import type { ChannelAdapter } from "./channel-adapter";
import type { InstagramApiClient } from "./instagram-api-client";
import type {
  ExchangeCodeResult,
  InboundMessage,
  OutboundContext,
  OutboundInput,
} from "./types";

interface IgWebhookPayload {
  object: "instagram";
  entry?: Array<{
    id: string;
    time?: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: { mid: string; text?: string };
    }>;
  }>;
}

export interface InstagramAdapterDeps {
  appId?: string;
  appSecret?: string;
}

export function createInstagramAdapter(
  client: InstagramApiClient,
  deps: InstagramAdapterDeps = {},
): ChannelAdapter {
  return {
    channel: "instagram",

    async parseInbound(
      rawPayload: string,
      signature: string,
      secret: string,
    ): Promise<InboundMessage[]> {
      const expected =
        "sha256=" +
        createHmac("sha256", secret).update(rawPayload).digest("hex");
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        throw new WebhookSignatureError();
      }

      const data = JSON.parse(rawPayload) as IgWebhookPayload;
      const out: InboundMessage[] = [];
      for (const entry of data.entry ?? []) {
        for (const m of entry.messaging ?? []) {
          if (!m.message?.mid || !m.message.text) continue;
          out.push({
            channel: "instagram",
            externalMessageId: m.message.mid,
            senderExternalId: m.sender.id,
            recipientExternalId: m.recipient.id,
            text: m.message.text,
            receivedAt: new Date(m.timestamp),
          });
        }
      }
      return out;
    },

    async sendOutbound(
      input: OutboundInput,
      context: OutboundContext,
    ): Promise<{ externalMessageId: string }> {
      if (!context.externalPageId) {
        throw new Error(
          "InstagramAdapter.sendOutbound: pageId(externalPageId) is required",
        );
      }
      const result = await client.sendMessage({
        recipientId: input.externalRecipientId,
        text: input.text,
        pageId: context.externalPageId,
        accessToken: context.accessToken,
      });
      return { externalMessageId: result.messageId };
    },

    async exchangeCode(
      code: string,
      redirectUri: string,
    ): Promise<ExchangeCodeResult> {
      if (!deps.appId || !deps.appSecret) {
        throw new Error(
          "InstagramAdapter.exchangeCode requires appId/appSecret in deps",
        );
      }
      const short = await client.exchangeShortLivedToken({
        code,
        redirectUri,
        appId: deps.appId,
        appSecret: deps.appSecret,
      });
      const long = await client.exchangeLongLivedToken({
        shortLivedToken: short.accessToken,
        appSecret: deps.appSecret,
      });
      const me = await client.getMe(long.accessToken);

      return {
        accessToken: long.accessToken,
        expiresAt: new Date(Date.now() + long.expiresIn * 1000),
        externalAccountId: me.id,
        externalAccountName: me.username,
        scopes: [
          "instagram_business_basic",
          "instagram_business_manage_messages",
        ],
      };
    },
  };
}
