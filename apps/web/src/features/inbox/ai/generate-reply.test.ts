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

// Epic 1B-Tone-2: tool use 패턴으로 4 tone 동시 생성. mock도 tool_use block 반환.
const TONES_FIXTURE = {
  warm: "사쿠라님~ 오후 3시 가능합니다 :)",
  formal: "안녕하십니까. 오후 3시 가능합니다.",
  short: "네, 15:00 가능.",
  friendly: "OK! 3시에 봬요!",
};

// Epic 1B-Tone Phase 2-A: verification self-check.
const VERIFICATIONS_FIXTURE = {
  warm: { state: "ok", label: "따뜻한 톤 유지", reason: null },
  formal: {
    state: "warn",
    label: "약간 사무적인 톤",
    reason: "환영 인사가 빠져 있어요.",
  },
  short: {
    state: "warn",
    label: "정보 누락 가능",
    reason: "디자이너 정보가 없어요.",
  },
  friendly: { state: "ok", label: "친근한 톤 유지", reason: null },
};

describe("generateReply (1B-Tone-2: 4 tone tool use)", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("tool_use 응답 → tones 4개 + reply(=warm) + 토큰 사용량 반환", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: TONES_FIXTURE,
        },
      ],
      usage: { input_tokens: 120, output_tokens: 80 },
    });

    const result = await generateReply({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "오늘 가능?" }],
    });

    expect(result.reply).toBe(TONES_FIXTURE.warm);
    expect(result.tones).toEqual(TONES_FIXTURE);
    expect(result.tokensUsed).toEqual({ input: 120, output: 80 });
  });

  it("Sonnet 모델 + buildPrompt + tool_choice=generate_tone_variations 호출", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: TONES_FIXTURE,
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await generateReply({
      storeName: "강남미용실",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "단발 가능?" }],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        system: expect.stringContaining("강남미용실"),
        messages: [{ role: "user", content: "단발 가능?" }],
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "generate_tone_variations" }),
        ]),
        tool_choice: { type: "tool", name: "generate_tone_variations" },
      }),
    );
  });

  it("응답에 tool_use block이 없으면 명시 에러로 throw", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "이건 text block만 있음" }],
      usage: { input_tokens: 1, output_tokens: 0 },
    });
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow(/tool_use block 없음/);
  });

  it("tool_use input에 tone 필드 누락 시 에러", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: { warm: "ok" }, // formal/short/friendly 누락
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow(/tone 필드 누락/);
  });

  it("Phase 2-A: verifications 4개 + tones 함께 반환 (정상 응답)", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: { ...TONES_FIXTURE, verifications: VERIFICATIONS_FIXTURE },
        },
      ],
      usage: { input_tokens: 130, output_tokens: 200 },
    });

    const result = await generateReply({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "오늘 가능?" }],
    });

    expect(result.verifications).toEqual(VERIFICATIONS_FIXTURE);
  });

  it("Phase 2-A: verifications 누락 시에도 tones는 정상 반환 (백워드 호환)", async () => {
    // 1B-Tone-2 시점 응답(verifications 없음)에서도 동작 보장.
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: TONES_FIXTURE, // verifications 없음
        },
      ],
      usage: { input_tokens: 100, output_tokens: 80 },
    });

    const result = await generateReply({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "오늘 가능?" }],
    });

    expect(result.tones).toEqual(TONES_FIXTURE);
    expect(result.verifications).toBeUndefined();
  });

  it("Phase 2-A: tool schema에 verifications 필드 description 포함", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: { ...TONES_FIXTURE, verifications: VERIFICATIONS_FIXTURE },
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await generateReply({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "hi" }],
    });

    const callArg = createMock.mock.calls[0][0];
    const tool = callArg.tools[0];
    expect(tool.input_schema.properties).toHaveProperty("verifications");
  });

  it("Phase 2-A: verifications.state가 'ok'/'warn' 외 값이면 reject", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "generate_tone_variations",
          input: {
            ...TONES_FIXTURE,
            verifications: {
              warm: { state: "bogus", label: "x", reason: null },
              formal: { state: "ok", label: "x", reason: null },
              short: { state: "ok", label: "x", reason: null },
              friendly: { state: "ok", label: "x", reason: null },
            },
          },
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await expect(
      generateReply({
        storeName: "X",
        customerLanguage: "ko",
        recentMessages: [{ direction: "inbound", text: "hi" }],
      }),
    ).rejects.toThrow(/verifications/);
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
