/**
 * NTS ↔ LOCALDATA 매장 매칭 점수화 함수 테스트.
 *
 * 사업장명·주소 각각 정규화 후 Levenshtein 유사도 계산 →
 * 가중평균 (이름 0.6 + 주소 0.4) → 임계값(0.85) 이상이면 matched=true.
 *
 * 임계값은 D7에 따라 Phase 1.5에서 50건 이상 데이터로 정밀화 예약.
 *
 * 점진 TDD (L-033) — `it.skip` 1개씩 enable.
 */
import { describe, expect, it } from "vitest";
import { computeMatchScore, MATCH_THRESHOLD } from "./match-score";

describe("computeMatchScore", () => {
  it("완전 일치하면 nameScore=addressScore=totalScore=1, matched=true", () => {
    const result = computeMatchScore({
      ntsName: "유민호헤어",
      ntsAddress: "서울 강남구 청담동 123-4",
      localdataName: "유민호헤어",
      localdataAddress: "서울 강남구 청담동 123-4",
    });
    expect(result.nameScore).toBe(1);
    expect(result.addressScore).toBe(1);
    expect(result.totalScore).toBe(1);
    expect(result.matched).toBe(true);
  });

  it("공백/시·도 약칭 차이만 있어도 정규화 후 완전 매칭", () => {
    const result = computeMatchScore({
      ntsName: "유민호 헤어",
      ntsAddress: "서울특별시 강남구 청담동",
      localdataName: "유민호헤어",
      localdataAddress: "서울 강남구 청담동",
    });
    expect(result.nameScore).toBe(1);
    expect(result.addressScore).toBe(1);
    expect(result.matched).toBe(true);
  });

  it("이름은 같지만 주소가 완전히 다르면 totalScore=0.6, matched=false", () => {
    const result = computeMatchScore({
      ntsName: "유민호헤어",
      ntsAddress: "서울 강남구 청담동",
      localdataName: "유민호헤어",
      localdataAddress: "부산 해운대구 우동",
    });
    expect(result.nameScore).toBe(1);
    expect(result.addressScore).toBeLessThan(0.5);
    expect(result.totalScore).toBeLessThan(MATCH_THRESHOLD);
    expect(result.matched).toBe(false);
  });

  it("이름·주소 모두 다르면 totalScore 낮고 matched=false", () => {
    const result = computeMatchScore({
      ntsName: "유민호헤어",
      ntsAddress: "서울 강남구 청담동",
      localdataName: "전혀다른가게",
      localdataAddress: "부산 해운대구 우동",
    });
    expect(result.totalScore).toBeLessThan(MATCH_THRESHOLD);
    expect(result.matched).toBe(false);
  });
});
