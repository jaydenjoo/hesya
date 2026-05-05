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

    // expect.objectContaining으로 캐스팅 제거 + 정확한 인자 검증.
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        system: expect.stringContaining("강남미용실"),
        messages: [{ role: "user", content: "단발 가능?" }],
      }),
    );
  });

  it("응답에 text block이 없으면 'text block 없음' 메시지로 throw", async () => {
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
    ).rejects.toThrow("text block 없음");
  });

  it("Anthropic SDK 에러는 도메인 에러로 래핑 (LLM02 키 prefix 누출 방지)", async () => {
    // SDK가 401 에러 메시지에 키 prefix("sk-ant-...")를 포함할 수 있음 → 상위로 그대로 전파 X.
    createMock.mockRejectedValue(
      new Error("AuthenticationError: invalid x-api-key sk-ant-xxxx"),
    );
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow("AI 응답 생성 실패");
    // 원본 키 prefix 누출 X
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.not.toThrow(/sk-ant-/);
  });
});
