import { z } from "zod";

export const sendOutboundInputSchema = z.object({
  conversationId: z.uuid(),
  text: z.string().min(1).max(2000),
});

export type SendOutboundInput = z.infer<typeof sendOutboundInputSchema>;
