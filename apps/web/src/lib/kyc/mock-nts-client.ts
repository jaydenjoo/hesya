/**
 * Mock NTS client (Plan v3, M1.2).
 *
 * `env.MOCK_KYC=true` 시 `actions.ts`에서 `validateBusinessNumber` 대신 호출.
 * 외부 데모 환경(Vercel Preview)에서 외부인이 사업자등록증 없이 KYC 흐름을
 * 통과할 수 있게 함.
 *
 * 사업자 등록 후 `env.MOCK_KYC=false`로 toggle하면 real-client(`nts-client.ts`)로
 * 자연 swap.
 *
 * Mock 정책:
 * - 입력 echo (b_no / p_nm 그대로) → "valid_match" 분기
 * - `valid="01"` (NTS_VALID_OK) → 자동 진위확인 통과
 * - `b_stt="계속사업자"` → 자동 승인 흐름 진입
 * - data.go.kr 외부 호출 0 → 비용 0 + 네트워크 지연 없음
 */
import "server-only";

import {
  NTS_VALID_OK,
  type NtsValidateBusiness,
  type NtsValidateData,
} from "@hesya/shared-types";

export async function mockValidateBusinessNumber(
  input: NtsValidateBusiness,
): Promise<NtsValidateData> {
  return {
    b_no: input.b_no,
    valid: NTS_VALID_OK,
    valid_msg: "일치 (MOCK_KYC=true 외부 데모)",
    status: {
      b_no: input.b_no,
      b_stt: "계속사업자",
      b_stt_cd: "01",
      tax_type: "부가가치세 일반과세자",
      tax_type_cd: "01",
    },
  };
}
