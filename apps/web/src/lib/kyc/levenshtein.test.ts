/**
 * Levenshtein 편집 거리 + 유사도(0~1) 계산 테스트.
 *
 * Levenshtein distance = 한 문자열을 다른 문자열로 바꾸는 데 필요한
 * 최소 편집 횟수 (삽입/삭제/치환). 유사도 = 1 - distance / max(len).
 *
 * 점진 TDD (L-033) — `it.skip` 1개씩 enable.
 */
import { describe, expect, it } from "vitest";
import { levenshteinDistance, levenshteinSimilarity } from "./levenshtein";

describe("levenshteinDistance", () => {
  it("동일한 문자열의 거리는 0이다", () => {
    expect(levenshteinDistance("abc", "abc")).toBe(0);
    expect(levenshteinDistance("", "")).toBe(0);
    expect(levenshteinDistance("청담살롱", "청담살롱")).toBe(0);
  });

  it("한 글자 차이의 거리는 1이다 (삽입/삭제/치환)", () => {
    expect(levenshteinDistance("abc", "abcd")).toBe(1);
    expect(levenshteinDistance("abcd", "abc")).toBe(1);
    expect(levenshteinDistance("abc", "abd")).toBe(1);
    expect(levenshteinDistance("청담살롱", "청담사롱")).toBe(1);
  });
});

describe("levenshteinSimilarity", () => {
  it("유사도는 1 - distance/max(len)으로 계산되며 동일하면 1, 빈 문자열 둘 다면 1", () => {
    expect(levenshteinSimilarity("abc", "abc")).toBe(1);
    expect(levenshteinSimilarity("", "")).toBe(1);
    expect(levenshteinSimilarity("abc", "abcd")).toBeCloseTo(0.75, 2);
    expect(levenshteinSimilarity("kitten", "sitting")).toBeCloseTo(0.571, 2);
  });
});
