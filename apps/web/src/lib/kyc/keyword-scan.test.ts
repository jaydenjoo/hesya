/**
 * E9-7 위험 키워드 차단 helper 단위 테스트.
 *
 * 매칭 규약: 단순 substring + case-insensitive (영문 키워드 대응).
 * 한글 substring은 case 영향 없음. 결과는 매칭된 키워드 list (중복 제거).
 */
import { describe, expect, it } from "vitest";
import { scanForDangerKeywords } from "./keyword-scan";

describe("scanForDangerKeywords", () => {
  it("plain한 매장명은 통과 (passed=true, flagged=빈 배열)", () => {
    const result = scanForDangerKeywords("청담미용실");
    expect(result.passed).toBe(true);
    expect(result.flagged).toEqual([]);
  });

  it("'마사지' 포함 시 fail + 정확히 1개 flag", () => {
    const result = scanForDangerKeywords("청담 발마사지 전문점");
    expect(result.passed).toBe(false);
    expect(result.flagged).toContain("마사지");
    expect(result.flagged).toContain("발마사지");
  });

  it("영문 키워드는 case-insensitive (Spa = spa)", () => {
    const result = scanForDangerKeywords("Seoul Beauty SPA");
    expect(result.passed).toBe(false);
    expect(result.flagged).toContain("spa");
  });

  it("한글 키워드는 정확히 매칭 (한의원만, '한방'은 별도 substring 아님)", () => {
    const result = scanForDangerKeywords("서울 한의원 부설 살롱");
    expect(result.passed).toBe(false);
    expect(result.flagged).toContain("한의원");
    expect(result.flagged).not.toContain("한방");
  });

  it("의료기기 카테고리 (LED/IPL/레이저)", () => {
    const result = scanForDangerKeywords("프리미엄 LED 케어 IPL 레이저");
    expect(result.passed).toBe(false);
    expect(result.flagged).toEqual(
      expect.arrayContaining(["LED", "IPL", "레이저"]),
    );
  });

  it("입력 여러 개를 동시에 검사 (배열 입력)", () => {
    const result = scanForDangerKeywords([
      "청담 미용실",
      "스파 전문",
      "헤어 케어",
    ]);
    expect(result.passed).toBe(false);
    expect(result.flagged).toContain("스파");
  });

  it("배열 내 null/undefined/empty 안전 처리", () => {
    const result = scanForDangerKeywords([
      null,
      undefined,
      "",
      "청담 헤어",
    ] as Array<string | null | undefined>);
    expect(result.passed).toBe(true);
    expect(result.flagged).toEqual([]);
  });

  it("같은 키워드가 여러 번 나와도 중복 제거", () => {
    const result = scanForDangerKeywords("마사지 마사지 마사지");
    expect(result.flagged.filter((k) => k === "마사지")).toHaveLength(1);
  });
});
