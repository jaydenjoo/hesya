import { z } from "zod";

export const sendOutboundInputSchema = z.object({
  conversationId: z.uuid(),
  text: z.string().min(1).max(2000),
});

export type SendOutboundInput = z.infer<typeof sendOutboundInputSchema>;

export const acceptAiDraftInputSchema = z.object({
  messageId: z.uuid(),
});

export type AcceptAiDraftInput = z.infer<typeof acceptAiDraftInputSchema>;
