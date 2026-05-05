import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/inbox/ai/generate-and-store-reply", () => ({
  generateAndStoreReply: vi.fn(),
}));

import { processInbound } from "./process-inbound";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("processInbound (B-2 AI trigger)", () => {
  it("messageId로 generateAndStoreReply 호출", async () => {
    vi.mocked(generateAndStoreReply).mockResolvedValue({
      stored: true,
      aiMessageId: "out-id",
      tokensUsed: { input: 1, output: 1 },
    });
    await processInbound("msg-uuid-1");
    expect(generateAndStoreReply).toHaveBeenCalledWith("msg-uuid-1");
  });

  it("stored: true → undefined (silent)", async () => {
    vi.mocked(generateAndStoreReply).mockResolvedValue({
      stored: true,
      aiMessageId: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    await expect(processInbound("m")).resolves.toBeUndefined();
  });

  it("skip (stored: false) → undefined (silent, 정상 흐름)", async () => {
    vi.mocked(generateAndStoreReply).mockResolvedValue({
      stored: false,
      reason: "already_responded",
    });
    await expect(processInbound("m")).resolves.toBeUndefined();
  });

  it("generateAndStoreReply throw → throw 그대로 전파 (webhook route가 Sentry capture)", async () => {
    vi.mocked(generateAndStoreReply).mockRejectedValue(
      new Error("AI 응답 생성 실패"),
    );
    await expect(processInbound("m")).rejects.toThrow("AI 응답 생성 실패");
  });
});
