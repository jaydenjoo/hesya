import { z } from "zod";

const QUESTION_MAX = 500;
const ANSWER_MAX = 2000;

export const createFAQInputSchema = z.object({
  question: z.string().trim().min(1).max(QUESTION_MAX),
  answer: z.string().trim().min(1).max(ANSWER_MAX),
});

export type CreateFAQInput = z.infer<typeof createFAQInputSchema>;

export const updateFAQInputSchema = z.object({
  id: z.uuid(),
  question: z.string().trim().min(1).max(QUESTION_MAX),
  answer: z.string().trim().min(1).max(ANSWER_MAX),
});

export type UpdateFAQInput = z.infer<typeof updateFAQInputSchema>;

export const deleteFAQInputSchema = z.object({
  id: z.uuid(),
});

export type DeleteFAQInput = z.infer<typeof deleteFAQInputSchema>;

/** 매장당 FAQ 최대 등록 개수 — Sec-LOW-1 (벡터 DoS 방어, ivfflat lists=100 적합 범위). */
export const MAX_FAQS_PER_STORE = 200;
