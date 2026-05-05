import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  it("system prompt에 storeName이 포함된다", () => {
    const result = buildPrompt({
      storeName: "강남미용실",
      customerLanguage: "ko",
      recentMessages: [{ direction: "inbound", text: "안녕하세요" }],
    });
    expect(result.system).toContain("강남미용실");
  });

  it("system prompt가 customerLanguage를 명시한다", () => {
    const result = buildPrompt({
      storeName: "X",
      customerLanguage: "en",
      recentMessages: [{ direction: "inbound", text: "hi" }],
    });
    // 영어 또는 'en' 코드가 system prompt 어딘가 등장 (LLM이 고객 언어 컨텍스트 파악 가능)
    expect(result.system.toLowerCase()).toMatch(/english|영어|\ben\b/);
  });

  it("응답은 한국어로 작성하도록 system prompt에 명시 (사장 검수용)", () => {
    const result = buildPrompt({
      storeName: "X",
      customerLanguage: "vi",
      recentMessages: [{ direction: "inbound", text: "xin chào" }],
    });
    expect(result.system).toMatch(/한국어/);
  });

  it("recentMessages: inbound→user, outbound→assistant로 매핑", () => {
    const result = buildPrompt({
      storeName: "X",
      customerLanguage: "ko",
      recentMessages: [
        { direction: "inbound", text: "단발 가능?" },
        { direction: "outbound", text: "네 가능합니다." },
        { direction: "inbound", text: "오늘 가능?" },
      ],
    });
    expect(result.messages).toEqual([
      { role: "user", content: "단발 가능?" },
      { role: "assistant", content: "네 가능합니다." },
      { role: "user", content: "오늘 가능?" },
    ]);
  });

  it("5개 지원 언어(ko/en/zh/ja/vi) 모두 system prompt 빌드 성공", () => {
    const langs = ["ko", "en", "zh", "ja", "vi"] as const;
    for (const lang of langs) {
      const result = buildPrompt({
        storeName: "X",
        customerLanguage: lang,
        recentMessages: [{ direction: "inbound", text: "hi" }],
      });
      expect(result.system.length).toBeGreaterThan(0);
      expect(result.messages).toHaveLength(1);
    }
  });
});
