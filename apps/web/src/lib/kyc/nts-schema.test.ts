/**
 * NTS 응답 envelope Zod 스키마 회귀 테스트.
 *
 * 픽스처는 odcloud.kr nts-businessman/v1/validate 응답에서 추출. 명세 메타
 * 필드(request_cnt/valid_cnt/match_cnt) 누락 케이스도 통과해야 한다 —
 * 실 응답이 source of truth (L-027) + passthrough 회귀 방어.
 */
import { describe, expect, it } from "vitest";
import { ntsValidateResponseSchema, NTS_VALID_OK } from "@hesya/shared-types";

const validMatchResponse = {
  status_code: "OK",
  request_cnt: 1,
  valid_cnt: 1,
  match_cnt: 1,
  data: [
    {
      b_no: "1248100998",
      valid: "01",
      valid_msg: "확인되었습니다.",
      status: {
        b_no: "1248100998",
        b_stt: "계속사업자",
        b_stt_cd: "01",
        tax_type: "부가가치세 일반과세자",
        tax_type_cd: "01",
        end_dt: "",
        utcc_yn: "N",
      },
    },
  ],
};

const validMismatchResponse = {
  status_code: "OK",
  data: [
    {
      b_no: "1234567890",
      valid: "02",
      valid_msg: "주민등록번호와 사업자등록번호가 일치하지 않습니다.",
    },
  ],
};

const passthroughResponse = {
  status_code: "OK",
  request_cnt: 1,
  data: [
    {
      b_no: "1248100998",
      valid: "01",
      status: { b_no: "1248100998", b_stt: "계속사업자" },
    },
  ],
  some_future_meta_field: "envelope-evolution",
};

describe("ntsValidateResponseSchema", () => {
  it("정상 응답(valid='01')을 파싱하고 status 핵심 필드를 보존한다", () => {
    const parsed = ntsValidateResponseSchema.safeParse(validMatchResponse);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const first = parsed.data.data[0];
    expect(first?.b_no).toBe("1248100998");
    expect(first?.valid).toBe(NTS_VALID_OK);
    expect(first?.status?.b_stt).toBe("계속사업자");
    expect(first?.status?.tax_type).toBe("부가가치세 일반과세자");
  });

  it("status 누락 + 메타 필드 누락 응답도 통과한다 (모두 optional)", () => {
    const parsed = ntsValidateResponseSchema.safeParse(validMismatchResponse);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const first = parsed.data.data[0];
    expect(first?.valid).toBe("02");
    expect(first?.status).toBeUndefined();
    expect(parsed.data.request_cnt).toBeUndefined();
  });

  it("명세에 없는 추가 필드(passthrough)가 있어도 파싱 실패하지 않는다", () => {
    const parsed = ntsValidateResponseSchema.safeParse(passthroughResponse);
    expect(parsed.success).toBe(true);
  });
});
