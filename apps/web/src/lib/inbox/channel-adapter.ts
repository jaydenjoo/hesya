import type {
  Channel,
  ExchangeCodeResult,
  InboundMessage,
  OutboundContext,
  OutboundInput,
} from "./types";

export interface ChannelAdapter {
  channel: Channel;

  parseInbound(
    rawPayload: string,
    signature: string,
    secret: string,
  ): Promise<InboundMessage[]>;

  sendOutbound(
    input: OutboundInput,
    context: OutboundContext,
  ): Promise<{ externalMessageId: string }>;

  exchangeCode(code: string, redirectUri: string): Promise<ExchangeCodeResult>;
}
