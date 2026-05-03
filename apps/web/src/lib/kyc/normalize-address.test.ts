/**
 * 도로명 주소 정규화 함수 테스트.
 *
 * NTS와 LOCALDATA가 같은 매장에 대해 살짝 다른 주소 표기를 줄 수 있음
 * (시·도 약칭, "번지" 표기, 공백 차이). 비교 가능한 형태로 표준화.
 *
 * 점진 TDD (L-033) — `it.skip` 1개씩 enable.
 */
import { describe, expect, it } from "vitest";
import { normalizeAddress } from "./normalize-address";

describe("normalizeAddress", () => {
  it("빈 입력은 빈 문자열로 정규화된다", () => {
    expect(normalizeAddress("")).toBe("");
    expect(normalizeAddress(null)).toBe("");
    expect(normalizeAddress(undefined)).toBe("");
  });

  it("연속 공백을 단일 공백으로, 양끝 공백 제거", () => {
    expect(normalizeAddress("  강남구  청담동  ")).toBe("강남구 청담동");
    expect(normalizeAddress("강남구\t청담동\n123-4")).toBe(
      "강남구 청담동 123-4",
    );
  });

  it("시·도 약칭으로 통일한다 (서울특별시 → 서울, 경기도 → 경기)", () => {
    expect(normalizeAddress("서울특별시 강남구 청담동")).toBe(
      "서울 강남구 청담동",
    );
    expect(normalizeAddress("경기도 성남시 분당구")).toBe("경기 성남시 분당구");
    expect(normalizeAddress("부산광역시 해운대구")).toBe("부산 해운대구");
  });

  it("구 행정구역명도 약칭으로 통일한다 (전라북도/강원도/전북특별자치도)", () => {
    // 공공데이터가 신·구 표기 혼용 — 둘 다 같은 약칭으로 정규화
    expect(normalizeAddress("전라북도 전주시 완산구")).toBe(
      "전북 전주시 완산구",
    );
    expect(normalizeAddress("전북특별자치도 전주시")).toBe("전북 전주시");
    expect(normalizeAddress("강원도 춘천시")).toBe("강원 춘천시");
    expect(normalizeAddress("강원특별자치도 강릉시")).toBe("강원 강릉시");
  });

  it("'번지' 표기를 제거한다", () => {
    expect(normalizeAddress("강남구 청담동 123-4번지")).toBe(
      "강남구 청담동 123-4",
    );
    expect(normalizeAddress("강남구 청담동 5번지 2층")).toBe(
      "강남구 청담동 5 2층",
    );
  });
});
