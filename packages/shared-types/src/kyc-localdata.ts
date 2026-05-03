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
 *
 * 외부 노출 면적 (P2): envelope schema는 내부에 두고 비즈니스 helper만 export —
 * 호출자(client/cron/script)는 raw 응답에 대한 parse 책임을 지지 않음.
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
// Internal — 외부 노출 X. parseLocaldataResponse를 통해서만 사용.
const localdataSearchResponseSchema = z
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

export interface ParsedLocaldataResponse {
  items: LocaldataItem[];
  totalCount: number | null;
  pageNo: number | null;
  numOfRows: number | null;
}

/**
 * raw 응답을 schema로 검증한 뒤 비즈니스가 쓰는 형태로 정규화해서 반환.
 * 실패 시 z.ZodError throw — 호출자가 도메인 에러로 변환 책임.
 *
 * items는 배열 / { item: [...] } 두 형태 모두 정규화.
 */
export function parseLocaldataResponse(raw: unknown): ParsedLocaldataResponse {
  const parsed = localdataSearchResponseSchema.parse(raw);
  const itemsRaw = parsed.response?.body?.items;
  const items = !itemsRaw
    ? []
    : Array.isArray(itemsRaw)
      ? itemsRaw
      : (itemsRaw.item ?? []);
  return {
    items,
    totalCount: parsed.response?.body?.totalCount ?? null,
    pageNo: parsed.response?.body?.pageNo ?? null,
    numOfRows: parsed.response?.body?.numOfRows ?? null,
  };
}
