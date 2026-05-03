/**
 * 사업장명 정규화 함수 테스트.
 *
 * NTS 응답의 사업자명과 LOCALDATA 응답의 사업장명을 같은 형태로 비교 가능하게
 * 만들기 위한 정규화. 공백·법인 접미사·대소문자 차이를 흡수해서 두 문자열의
 * 의미적 동일성을 비교 가능하게 한다.
 *
 * 점진 TDD (L-033) — `it.skip` 1개씩 enable.
 */
import { describe, expect, it } from "vitest";
import { normalizeBusinessName } from "./normalize-business-name";

describe("normalizeBusinessName", () => {
  it("빈 입력은 빈 문자열로 정규화된다", () => {
    expect(normalizeBusinessName("")).toBe("");
    expect(normalizeBusinessName(null)).toBe("");
    expect(normalizeBusinessName(undefined)).toBe("");
  });

  it("공백을 모두 제거한다", () => {
    expect(normalizeBusinessName("유민호 헤어")).toBe("유민호헤어");
    expect(normalizeBusinessName("  청담  살롱  ")).toBe("청담살롱");
    expect(normalizeBusinessName("강남\t뷰티")).toBe("강남뷰티");
  });

  it("법인 접미사를 제거한다 ((주), ㈜, 주식회사)", () => {
    expect(normalizeBusinessName("(주)헤어샵")).toBe("헤어샵");
    expect(normalizeBusinessName("㈜뷰티랩")).toBe("뷰티랩");
    expect(normalizeBusinessName("주식회사강남미용")).toBe("강남미용");
    expect(normalizeBusinessName("헤어샵(주)")).toBe("헤어샵");
  });

  it("영문은 소문자로 통일한다", () => {
    expect(normalizeBusinessName("HAIR Studio")).toBe("hairstudio");
    expect(normalizeBusinessName("Beauty LAB")).toBe("beautylab");
  });

  it("모든 변환을 동시 적용한다 (공백 + 접미사 + 대소문자)", () => {
    expect(normalizeBusinessName("(주) HAIR 청담")).toBe("hair청담");
    expect(normalizeBusinessName("  ㈜ Beauty 강남  ")).toBe("beauty강남");
  });
});
