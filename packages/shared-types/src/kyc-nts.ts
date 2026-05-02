/**
 * 국세청_사업자등록정보 진위확인 API (data.go.kr publicDataPk=15081808)
 *
 * Endpoint: POST https://api.odcloud.kr/api/nts-businessman/v1/validate
 * Doc: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15081808
 *
 * Epic 9 § Step 1 — 진위확인. 사업자번호 + 개업일자 + 대표자명 3개로 매칭 검증.
 * status (상태조회)는 이 Task 범위 밖.
 *
 * 응답 필드는 명세에 없는 게 추가될 수 있어 .passthrough() — 핵심 필드만 strict.
 */
import { z } from "zod";

/** valid 코드 — "01" = 일치 (진위 OK), "02" 이상 = 불일치/오류. 실제 코드는 명세 외 추가 가능 → string */
export const NTS_VALID_OK = "01" as const;

/** PRD § 7 store_verifications.ntsStatus 가능 값 (한국어 그대로 저장). 빈 문자열 케이스 있음 */
export const NTS_BUSINESS_STATUSES = [
  "계속사업자",
  "휴업자",
  "폐업자",
] as const;

const ntsBusinessStatusSchema = z
  .object({
    b_no: z.string(),
    b_stt: z.string(),
    b_stt_cd: z.string().optional(),
    tax_type: z.string().optional(),
    tax_type_cd: z.string().optional(),
    end_dt: z.string().optional(),
    utcc_yn: z.string().optional(),
    tax_type_change_dt: z.string().optional(),
    invoice_apply_dt: z.string().optional(),
    rbf_tax_type: z.string().optional(),
    rbf_tax_type_cd: z.string().optional(),
  })
  .passthrough();

export const ntsValidateBusinessSchema = z.object({
  b_no: z.string().regex(/^\d{10}$/, "사업자등록번호는 하이픈 없이 10자리"),
  start_dt: z.string().regex(/^\d{8}$/, "개업일자는 YYYYMMDD 8자리"),
  p_nm: z.string().min(1, "대표자명 필수"),
  p_nm2: z.string().optional(),
  b_nm: z.string().optional(),
  corp_no: z.string().optional(),
  b_sector: z.string().optional(),
  b_type: z.string().optional(),
  // v1.1 (2024-05-31) 추가 — 사업장주소. 진위확인 정밀도 향상용 옵션 필드.
  b_adr: z.string().optional(),
});

export const ntsValidateRequestSchema = z.object({
  businesses: ntsValidateBusinessSchema.array().min(1).max(100),
});

const ntsValidateDataSchema = z
  .object({
    b_no: z.string(),
    valid: z.string(),
    valid_msg: z.string().optional(),
    status: ntsBusinessStatusSchema.optional(),
    request_param: z.unknown().optional(),
  })
  .passthrough();

// /validate 응답 (공식 명세 v1.1 2024-05-31): { status_code, request_cnt, valid_cnt, data[] }
// 그러나 실 응답에서 명세 메타 필드(request_cnt/valid_cnt/match_cnt)가 누락되는
// 케이스 관찰됨 — 명세 stale 또는 케이스별 가변. 비즈니스 로직은 data[]만 사용하므로
// 메타 필드 모두 optional + passthrough. 실 응답이 source of truth (L-027 정신).
export const ntsValidateResponseSchema = z
  .object({
    status_code: z.string(),
    request_cnt: z.number().optional(),
    valid_cnt: z.number().optional(),
    match_cnt: z.number().optional(),
    data: ntsValidateDataSchema.array(),
  })
  .passthrough();

export type NtsValidateBusiness = z.infer<typeof ntsValidateBusinessSchema>;
export type NtsValidateRequest = z.infer<typeof ntsValidateRequestSchema>;
export type NtsValidateResponse = z.infer<typeof ntsValidateResponseSchema>;
export type NtsValidateData = z.infer<typeof ntsValidateDataSchema>;
