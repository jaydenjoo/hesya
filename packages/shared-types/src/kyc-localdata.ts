/**
 * 행정안전부_생활_미용업 조회서비스 (data.go.kr 1741000)
 *
 * Endpoint: GET https://apis.data.go.kr/1741000/beauty_salons/info
 * 활용기간: 2026-05-02 ~ 2028-05-02 / 일일 10,000회 / 매일 갱신 (D-2 기준)
 *
 * Epic 9 § Step 2 — 미용업 영업신고 매칭. 사업자번호 직접 검색은 미지원이므로
 * 사업장명(LIKE) + 도로명주소(LIKE) 조합으로 후보 검색 → 다음 단계에서 퍼지 매칭.
 *
 * L-029 적용: 응답 필드는 명세에 없는 게 추가될 수 있어 .passthrough() —
 * 비즈니스 로직이 사용하는 필드만 strict, 메타·미관찰 필드는 optional.
 */
import { z } from "zod";

/** 영업상태코드 (참고문서: 개방자치단체코드_영업상태코드.xlsx). LOCALDATA 표준 */
export const SALS_STTS_OPEN = "01" as const;
export const SALS_STTS_CLOSED = "03" as const;

export const localdataSearchInputSchema = z.object({
  bplcNm: z.string().trim().min(1, "사업장명 필수"),
  roadNmAddr: z.string().trim().optional(),
  pageNo: z.number().int().min(1).default(1),
  numOfRows: z.number().int().min(1).max(100).default(10),
});

const localdataItemSchema = z
  .object({
    BPLC_NM: z.string().optional(),
    ROAD_NM_ADDR: z.string().optional(),
    LCPMT_YMD: z.string().optional(),
    SALS_STTS_CD: z.string().optional(),
    DAT_UPDT_PNT: z.string().optional(),
    OPN_ATMY_GRP_CD: z.string().optional(),
  })
  .passthrough();

const localdataHeaderSchema = z
  .object({
    resultCode: z.string().optional(),
    resultMsg: z.string().optional(),
  })
  .passthrough();

// 공공데이터포털 표준 envelope: items가 배열 또는 { item: [...] } 두 형태 모두 관찰됨.
// 첫 호출 후 실제 응답으로 보정 가능하도록 union으로 받음.
const localdataItemsSchema = z.union([
  localdataItemSchema.array(),
  z.object({ item: localdataItemSchema.array() }).passthrough(),
]);

const localdataBodySchema = z
  .object({
    items: localdataItemsSchema.optional(),
    numOfRows: z.coerce.number().int().optional(),
    pageNo: z.coerce.number().int().optional(),
    totalCount: z.coerce.number().int().optional(),
  })
  .passthrough();

// envelope 자체도 `response` (공공데이터 표준) 또는 `result` 등으로 다를 수 있어
// passthrough + optional. 첫 호출 후 보정.
export const localdataSearchResponseSchema = z
  .object({
    response: z
      .object({
        header: localdataHeaderSchema.optional(),
        body: localdataBodySchema.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type LocaldataSearchInput = z.infer<typeof localdataSearchInputSchema>;
export type LocaldataItem = z.infer<typeof localdataItemSchema>;
export type LocaldataSearchResponse = z.infer<
  typeof localdataSearchResponseSchema
>;

/** 응답에서 items 배열을 정규화해서 꺼낸다 (배열 / { item: [...] } 두 형태 통합) */
export function extractLocaldataItems(
  parsed: LocaldataSearchResponse,
): LocaldataItem[] {
  const items = parsed.response?.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return items.item ?? [];
}
