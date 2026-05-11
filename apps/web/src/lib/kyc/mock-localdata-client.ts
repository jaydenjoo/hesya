/**
 * Mock LocalData client (Plan v3, M1.2).
 *
 * `env.MOCK_KYC=true` 시 `actions.ts`에서 `searchBeautyShops` 대신 호출.
 *
 * Mock 정책:
 * - 입력 echo (bplcNm / roadNmAddr 그대로) → 매칭 점수 100% → `matched=true`
 * - `SALS_STTS_CD="01"` (영업중) → 자동 승인
 * - `OPN_ATMY_GRP_CD="200"` (미용업) → PRD § Not Doing 카테고리 안 걸림
 * - 외부 호출 0
 */
import "server-only";

import type {
  LocaldataSearchInput,
  ParsedLocaldataResponse,
} from "@hesya/shared-types";

export async function mockSearchBeautyShops(
  input: LocaldataSearchInput,
): Promise<ParsedLocaldataResponse> {
  return {
    items: [
      {
        BPLC_NM: input.bplcNm,
        ROAD_NM_ADDR: input.roadNmAddr ?? "",
        SALS_STTS_CD: "01",
        OPN_ATMY_GRP_CD: "200",
      },
    ],
    totalCount: 1,
    pageNo: input.pageNo,
    numOfRows: input.numOfRows,
  };
}
