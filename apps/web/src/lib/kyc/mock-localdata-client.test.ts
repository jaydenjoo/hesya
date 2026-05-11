/**
 * Plan v3 M1.2 — Mock LocalData client 단위 테스트.
 *
 * 검증:
 * 1. 입력 echo (BPLC_NM, ROAD_NM_ADDR) — 매칭 점수 100%
 * 2. SALS_STTS_CD="01" (영업중) → 자동 승인
 * 3. OPN_ATMY_GRP_CD="200" (미용업) → PRD § Not Doing 카테고리 미적용
 * 4. items 길이 1 + totalCount 1
 */
import { describe, it, expect } from "vitest";
import { mockSearchBeautyShops } from "./mock-localdata-client";

describe("mockSearchBeautyShops", () => {
  const baseInput = {
    bplcNm: "Hesya 데모 헤어샵",
    roadNmAddr: "서울특별시 강남구 테헤란로 1",
    pageNo: 1,
    numOfRows: 50,
  } as const;

  it("입력 bplcNm을 items[0].BPLC_NM에 echo (매칭 점수 100%)", async () => {
    const result = await mockSearchBeautyShops(baseInput);
    expect(result.items[0]?.BPLC_NM).toBe("Hesya 데모 헤어샵");
  });

  it("입력 roadNmAddr을 items[0].ROAD_NM_ADDR에 echo", async () => {
    const result = await mockSearchBeautyShops(baseInput);
    expect(result.items[0]?.ROAD_NM_ADDR).toBe("서울특별시 강남구 테헤란로 1");
  });

  it("SALS_STTS_CD는 01 (영업중) → 자동 승인 흐름", async () => {
    const result = await mockSearchBeautyShops(baseInput);
    expect(result.items[0]?.SALS_STTS_CD).toBe("01");
  });

  it("OPN_ATMY_GRP_CD는 200 (미용업) → Not Doing 카테고리 미적용", async () => {
    const result = await mockSearchBeautyShops(baseInput);
    expect(result.items[0]?.OPN_ATMY_GRP_CD).toBe("200");
  });

  it("items 길이는 1, totalCount는 1", async () => {
    const result = await mockSearchBeautyShops(baseInput);
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it("roadNmAddr 없을 때 빈 문자열로 fallback", async () => {
    const result = await mockSearchBeautyShops({
      ...baseInput,
      roadNmAddr: undefined,
    });
    expect(result.items[0]?.ROAD_NM_ADDR).toBe("");
  });
});
