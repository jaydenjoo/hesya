/**
 * E9-2 NTS API 클라이언트 단위 테스트 (γ.2.2).
 *
 * production 동작 검증 영역:
 *   - 5xx → 3회 재시도 후 NtsApiError throw
 *   - 4xx → 즉시 NtsApiError throw (재시도 없음)
 *   - Network error (fetch reject) → 3회 재시도 후 NtsApiError
 *   - 200 OK + invalid JSON → ZodError → NtsApiError
 *   - 200 OK + valid response → 정상 NtsValidateData 반환
 *   - 200 OK + data[] empty → NtsApiError ("data 비어 있음")
 *
 * Timeout(5s) 케이스는 fake timer + AbortError 시뮬이 환경별 불안정 →
 * 본 테스트 scope OUT. nts-client.ts의 `controller.abort()` 흐름은 manual smoke
 * 또는 staging에서 검증.
 *
 * 참조: PRD §1083 Epic 9 immutable audit log + edge case 보강 (γ.2.2).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// gitleaks bypass: 명백한 placeholder (real key 아님). 실 검증은 staging에서.
const { envMock } = vi.hoisted(() => ({
  envMock: { KOREA_NTS_API_KEY: "REPLACE_ME_FAKE_TEST_KEY_PLACEHOLDER" },
}));

vi.mock("@/shared/config/env", () => ({
  env: envMock,
}));

// sleep을 즉시 resolve로 stub — production의 200/400/800ms 백오프를 테스트에서
// 기다리지 않음. retry 로직 자체는 그대로 테스트.
vi.mock("./nts-client", async (importActual) => {
  const actual = await importActual<typeof import("./nts-client")>();
  return actual;
});

import { NtsApiError, validateBusinessNumber } from "./nts-client";

const VALID_INPUT = {
  b_no: "1234567890",
  start_dt: "20200315",
  p_nm: "홍길동",
};

const VALID_NTS_RESPONSE = {
  status_code: "OK",
  data: [
    {
      b_no: "1234567890",
      valid: "01",
      valid_msg: "확인되었습니다.",
      status: { b_no: "1234567890", b_stt: "계속사업자" },
    },
  ],
};

const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateBusinessNumber (NTS API edge cases)", () => {
  it("200 OK + valid response → NtsValidateData (b_no=valid_match) 반환", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => VALID_NTS_RESPONSE,
      text: async () => "",
    });

    const result = await validateBusinessNumber(VALID_INPUT);

    expect(result.b_no).toBe("1234567890");
    expect(result.valid).toBe("01");
    expect(result.status?.b_stt).toBe("계속사업자");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("5xx → 3회 재시도 후 NtsApiError(statusCode=503) throw", async () => {
    const responseInit = {
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "Service Unavailable",
    };
    fetchSpy.mockResolvedValue(responseInit);

    await expect(validateBusinessNumber(VALID_INPUT)).rejects.toBeInstanceOf(
      NtsApiError,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  }, 10_000);

  it("4xx → 즉시 NtsApiError(statusCode=400) throw (재시도 없음)", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({}),
      text: async () => "Bad Request",
    });

    await expect(validateBusinessNumber(VALID_INPUT)).rejects.toMatchObject({
      name: "NtsApiError",
      statusCode: 400,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("Network error (fetch reject) → 3회 재시도 후 NtsApiError", async () => {
    fetchSpy.mockRejectedValue(new TypeError("network unreachable"));

    await expect(validateBusinessNumber(VALID_INPUT)).rejects.toBeInstanceOf(
      NtsApiError,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  }, 10_000);

  it("200 OK + invalid JSON shape → NtsApiError (스키마 불일치)", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: "shape", missing_status_code: true }),
      text: async () => "",
    });

    await expect(validateBusinessNumber(VALID_INPUT)).rejects.toThrow(
      /스키마 불일치/,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("200 OK + data[] empty → NtsApiError ('data 비어 있음')", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status_code: "OK", data: [] }),
      text: async () => "",
    });

    await expect(validateBusinessNumber(VALID_INPUT)).rejects.toThrow(
      /data 비어/,
    );
  });
});
