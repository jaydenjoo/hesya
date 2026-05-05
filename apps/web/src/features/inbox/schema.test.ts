import { describe, it, expect } from "vitest";
import { sendOutboundInputSchema, acceptAiDraftInputSchema } from "./schema";

describe("inbox schema", () => {
  it("sendOutboundInputSchema validates UUID + text 1~2000", () => {
    const ok = sendOutboundInputSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      text: "안녕",
    });
    expect(ok.success).toBe(true);
  });

  it("sendOutboundInputSchema rejects empty text", () => {
    const r = sendOutboundInputSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      text: "",
    });
    expect(r.success).toBe(false);
  });

  it("sendOutboundInputSchema rejects text > 2000", () => {
    const r = sendOutboundInputSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      text: "x".repeat(2001),
    });
    expect(r.success).toBe(false);
  });

  it("acceptAiDraftInputSchema: tone 옵셔널 (Epic 1B-Tone-4)", () => {
    const ok = acceptAiDraftInputSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      tone: "warm",
    });
    expect(ok.success).toBe(true);
  });

  it("acceptAiDraftInputSchema: tone 미제공 OK (1B-Tone 이전 호환)", () => {
    const ok = acceptAiDraftInputSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(ok.success).toBe(true);
  });

  it("acceptAiDraftInputSchema: tone 잘못된 값 reject", () => {
    const r = acceptAiDraftInputSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      tone: "casual", // not in enum
    });
    expect(r.success).toBe(false);
  });
});
