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

/**
 * Customer 확장 (CC-6) — 사장이 ContextPanel에서 customer 메모 편집.
 * conversationId는 ownership 검증용 (customer→conv→store join), customerId는
 * 실제 update 대상. 둘 다 UUID 강제. allergyNote/preferredDesigner 옵셔널 nullable.
 *
 * **Code LOW-7**: preferredDesigner는 이름 필드 표준 100자 (3-layer 통일:
 * Zod + DB CHECK + UI maxLength). allergyNote는 메모 자유 입력 500자 유지.
 */
export const updateCustomerNotesInputSchema = z.object({
  conversationId: z.uuid(),
  customerId: z.uuid(),
  allergyNote: z.string().max(500).nullable().optional(),
  preferredDesigner: z.string().max(100).nullable().optional(),
});

export type UpdateCustomerNotesInput = z.infer<
  typeof updateCustomerNotesInputSchema
>;
