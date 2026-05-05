import { describe, it, expect, vi, beforeEach } from "vitest";

// @anthropic-ai/sdk 전체 mock — 단위 테스트는 외부 호출 X.
// `new Anthropic({...})` 호환을 위해 class 형태로 mock.
const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: createMock };
  },
}));

import { generateReply } from "./generate-reply";

describe("generateReply", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("Anthropic 응답 텍스트 + 토큰 사용량을 반환", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "네, 오후 3시 가능합니다." }],
      usage: { input_tokens: 120, output_tokens: 40 },
    });

    const result = await generateReply({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "오늘 가능?" }],
    });

    expect(result.reply).toBe("네, 오후 3시 가능합니다.");
    expect(result.tokensUsed).toEqual({ input: 120, output: 40 });
  });

  it("Sonnet 모델 + buildPrompt 결과 그대로 호출 (system + messages)", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await generateReply({
      storeName: "강남미용실",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "단발 가능?" }],
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const arg = createMock.mock.calls[0]![0] as {
      model: string;
      system: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(arg.model).toBe("claude-sonnet-4-6");
    expect(arg.system).toContain("강남미용실");
    expect(arg.messages).toEqual([{ role: "user", content: "단발 가능?" }]);
  });

  it("응답에 text block이 없으면 throw", async () => {
    createMock.mockResolvedValue({
      content: [],
      usage: { input_tokens: 1, output_tokens: 0 },
    });
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow();
  });

  it("Anthropic 호출 실패는 그대로 전파 (silent failure 금지)", async () => {
    createMock.mockRejectedValue(new Error("network down"));
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow("network down");
  });
});
