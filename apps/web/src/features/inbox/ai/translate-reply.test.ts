import { describe, it, expect, vi, beforeEach } from "vitest";

// `new Anthropic({...})` 호환을 위해 class 형태로 mock (B-1 패턴 동일).
const messagesCreateMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: messagesCreateMock };
  },
}));

import { translateReply } from "./translate-reply";

beforeEach(() => {
  messagesCreateMock.mockReset();
});

describe("translateReply (B-3a)", () => {
  it("module exports translateReply function (pure)", async () => {
    const mod = await import("./translate-reply");
    expect(typeof mod.translateReply).toBe("function");
  });

  it("targetLanguage='ko' → SDK 호출 안 함, 입력 그대로 반환 (no-op)", async () => {
    const result = await translateReply({
      koreanText: "안녕하세요",
      targetLanguage: "ko",
    });
    expect(result).toEqual({
      translatedText: "안녕하세요",
      tokensUsed: { input: 0, output: 0 },
    });
    expect(messagesCreateMock).not.toHaveBeenCalled();
  });

  it("targetLanguage='en' → SDK 호출 + 영어 라벨 prompt + 한국어 user content", async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "Hello" }],
      usage: { input_tokens: 8, output_tokens: 3 },
    });

    const result = await translateReply({
      koreanText: "안녕",
      targetLanguage: "en",
    });

    expect(result).toEqual({
      translatedText: "Hello",
      tokensUsed: { input: 8, output: 3 },
    });
    expect(messagesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        system: expect.stringContaining("English"),
        messages: [{ role: "user", content: "안녕" }],
      }),
    );
  });

  it("5개 언어 모두 라벨 매핑 — zh/ja/vi 누락 회귀 방어", async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "translated" }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await translateReply({ koreanText: "x", targetLanguage: "zh" });
    expect(messagesCreateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Chinese"),
      }),
    );

    await translateReply({ koreanText: "x", targetLanguage: "ja" });
    expect(messagesCreateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Japanese"),
      }),
    );

    await translateReply({ koreanText: "x", targetLanguage: "vi" });
    expect(messagesCreateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Vietnamese"),
      }),
    );
  });

  it("SDK 에러 → 'AI 번역 실패' 도메인 에러로 wrap (LLM02 키 prefix 누출 방지)", async () => {
    messagesCreateMock.mockRejectedValue(
      new Error("401 invalid x-api-key sk-ant-real-..."),
    );
    await expect(
      translateReply({ koreanText: "x", targetLanguage: "en" }),
    ).rejects.toThrow("AI 번역 실패");
  });

  it("system prompt가 입력을 'data to translate'로 framing (LLM01 review HIGH)", async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "Hello" }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await translateReply({ koreanText: "안녕", targetLanguage: "en" });
    const call = messagesCreateMock.mock.calls[0]![0];
    expect(call.system).toMatch(/text to translate|input is data/i);
  });

  it("text block 부재 → 명시 에러", async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "tool_use" }],
      usage: { input_tokens: 1, output_tokens: 0 },
    });
    await expect(
      translateReply({ koreanText: "x", targetLanguage: "en" }),
    ).rejects.toThrow("text block 없음");
  });
});
