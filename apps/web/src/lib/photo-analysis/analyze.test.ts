import { describe, expect, it } from "vitest";
import { __test } from "./analyze";

describe("photo-analysis/analyze (pure)", () => {
  describe("parseResponse", () => {
    it("정상 JSON → VisionAnalysisResult 반환", () => {
      const text = JSON.stringify({
        styleName: "Korean layered bob",
        difficulty: "medium",
        estimatedMinutes: 150,
        compatibilityNote: "Works on fine straight hair",
        confidence: 0.88,
      });
      const out = __test.parseResponse(text);
      expect(out.styleName).toBe("Korean layered bob");
      expect(out.difficulty).toBe("medium");
      expect(out.estimatedMinutes).toBe(150);
      expect(out.confidence).toBe(0.88);
    });

    it("난이도 범위 밖 → invalid Vision response shape", () => {
      const text = JSON.stringify({
        styleName: "Test",
        difficulty: "extreme",
        estimatedMinutes: 60,
        compatibilityNote: "n/a",
        confidence: 0.5,
      });
      expect(() => __test.parseResponse(text)).toThrow(
        /invalid Vision response shape/,
      );
    });

    it("estimatedMinutes 너무 작음 → invalid", () => {
      const text = JSON.stringify({
        styleName: "Test",
        difficulty: "easy",
        estimatedMinutes: 5,
        compatibilityNote: "n/a",
        confidence: 0.5,
      });
      expect(() => __test.parseResponse(text)).toThrow(/invalid/);
    });

    it("confidence > 1 → invalid", () => {
      const text = JSON.stringify({
        styleName: "Test",
        difficulty: "easy",
        estimatedMinutes: 60,
        compatibilityNote: "n/a",
        confidence: 1.5,
      });
      expect(() => __test.parseResponse(text)).toThrow(/invalid/);
    });

    it("필수 필드 누락 → invalid", () => {
      const text = JSON.stringify({
        styleName: "Test",
        difficulty: "easy",
        estimatedMinutes: 60,
      });
      expect(() => __test.parseResponse(text)).toThrow(/invalid/);
    });

    it("JSON parse 실패 → invalid JSON", () => {
      expect(() => __test.parseResponse("not json")).toThrow(/invalid JSON/);
    });
  });

  it("MODEL은 claude-opus-4-7", () => {
    expect(__test.MODEL).toBe("claude-opus-4-7");
  });
});
