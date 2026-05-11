/**
 * Plan v3 M1.2 — Mock NTS client 단위 테스트.
 *
 * 검증:
 * 1. 입력 echo (b_no, status.b_no) — 매칭 점수 100%
 * 2. valid="01" (NTS_VALID_OK) → 자동 진위확인 통과 분기 진입
 * 3. b_stt="계속사업자" → 자동 승인 흐름 진입
 * 4. 외부 호출 0 (네트워크 fetch 안 함)
 */
import { describe, it, expect } from "vitest";
import { NTS_VALID_OK } from "@hesya/shared-types";
import { mockValidateBusinessNumber } from "./mock-nts-client";

describe("mockValidateBusinessNumber", () => {
  const baseInput = {
    b_no: "1234567890",
    start_dt: "20200101",
    p_nm: "홍길동",
  } as const;

  it("입력 b_no를 응답에 echo", async () => {
    const result = await mockValidateBusinessNumber(baseInput);
    expect(result.b_no).toBe("1234567890");
    expect(result.status?.b_no).toBe("1234567890");
  });

  it("valid 코드는 NTS_VALID_OK(01) 반환", async () => {
    const result = await mockValidateBusinessNumber(baseInput);
    expect(result.valid).toBe(NTS_VALID_OK);
    expect(result.valid).toBe("01");
  });

  it("status.b_stt는 계속사업자 (자동 승인 흐름 진입)", async () => {
    const result = await mockValidateBusinessNumber(baseInput);
    expect(result.status?.b_stt).toBe("계속사업자");
    expect(result.status?.b_stt_cd).toBe("01");
  });

  it("status.tax_type은 부가가치세 일반과세자", async () => {
    const result = await mockValidateBusinessNumber(baseInput);
    expect(result.status?.tax_type).toBe("부가가치세 일반과세자");
    expect(result.status?.tax_type_cd).toBe("01");
  });

  it("valid_msg에 MOCK_KYC 표시 (운영자가 mock 응답임을 식별)", async () => {
    const result = await mockValidateBusinessNumber(baseInput);
    expect(result.valid_msg).toContain("MOCK_KYC");
  });
});
