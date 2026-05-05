import { describe, it, expect } from "vitest";
import {
  createFAQInputSchema,
  updateFAQInputSchema,
  deleteFAQInputSchema,
  MAX_FAQS_PER_STORE,
} from "./schema";

describe("knowledge.schema (B-4c)", () => {
  it("createFAQInputSchema: 정상 입력 통과", () => {
    const r = createFAQInputSchema.safeParse({
      question: "단발 가능?",
      answer: "네 가능합니다",
    });
    expect(r.success).toBe(true);
  });

  it("createFAQInputSchema: 빈 question → 실패", () => {
    const r = createFAQInputSchema.safeParse({ question: "", answer: "x" });
    expect(r.success).toBe(false);
  });

  it("createFAQInputSchema: 공백만 question → 실패 (trim)", () => {
    const r = createFAQInputSchema.safeParse({
      question: "   ",
      answer: "x",
    });
    expect(r.success).toBe(false);
  });

  it("createFAQInputSchema: question 500자 초과 → 실패", () => {
    const r = createFAQInputSchema.safeParse({
      question: "가".repeat(501),
      answer: "x",
    });
    expect(r.success).toBe(false);
  });

  it("createFAQInputSchema: answer 2000자 초과 → 실패", () => {
    const r = createFAQInputSchema.safeParse({
      question: "x",
      answer: "가".repeat(2001),
    });
    expect(r.success).toBe(false);
  });

  it("updateFAQInputSchema: 정상 UUID + 입력 통과", () => {
    const r = updateFAQInputSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      question: "Q",
      answer: "A",
    });
    expect(r.success).toBe(true);
  });

  it("updateFAQInputSchema: 잘못된 UUID → 실패", () => {
    const r = updateFAQInputSchema.safeParse({
      id: "not-a-uuid",
      question: "Q",
      answer: "A",
    });
    expect(r.success).toBe(false);
  });

  it("deleteFAQInputSchema: 정상 UUID 통과", () => {
    const r = deleteFAQInputSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.success).toBe(true);
  });

  it("MAX_FAQS_PER_STORE 상수: 200 (벡터 DoS 방어)", () => {
    expect(MAX_FAQS_PER_STORE).toBe(200);
  });
});
