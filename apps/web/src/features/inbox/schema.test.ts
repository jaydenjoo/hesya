import { describe, it, expect } from "vitest";
import { sendOutboundInputSchema } from "./schema";

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
});
