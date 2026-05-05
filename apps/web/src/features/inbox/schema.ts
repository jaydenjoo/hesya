import { z } from "zod";

export const sendOutboundInputSchema = z.object({
  conversationId: z.uuid(),
  text: z.string().min(1).max(2000),
});

export type SendOutboundInput = z.infer<typeof sendOutboundInputSchema>;

export const TONE_VALUES = ["warm", "formal", "short", "friendly"] as const;
export type Tone = (typeof TONE_VALUES)[number];

export const acceptAiDraftInputSchema = z.object({
  messageId: z.uuid(),
  /** Epic 1B-Tone-4 — 미지정 시 originalText(=warm) 기본 발송. */
  tone: z.enum(TONE_VALUES).optional(),
});

export type AcceptAiDraftInput = z.infer<typeof acceptAiDraftInputSchema>;

/** Phase 2-B — 매장 톤 학습 (사장 명시 클릭). 1~500자 (D5 결정). */
export const learnStoreToneInputSchema = z.object({
  text: z.string().min(1).max(500),
});

export type LearnStoreToneInput = z.infer<typeof learnStoreToneInputSchema>;
