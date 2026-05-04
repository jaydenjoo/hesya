export type Channel = "instagram" | "whatsapp" | "kakao" | "line" | "messenger";

export interface InboundMessage {
  channel: Channel;
  externalThreadId?: string;
  externalMessageId: string;
  senderExternalId: string;
  recipientExternalId: string;
  text: string;
  receivedAt: Date;
}

export interface OutboundInput {
  externalRecipientId: string;
  text: string;
}

export interface OutboundContext {
  accessToken: string;
  externalAccountId?: string;
  externalPageId?: string;
}

export interface ExchangeCodeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
  externalAccountId: string;
  externalPageId?: string;
  externalAccountName?: string;
  scopes: string[];
}
