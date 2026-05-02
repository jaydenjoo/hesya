/**
 * 국세청 사업자등록 진위확인 클라이언트 (Server-only).
 *
 * - 인증키: Decoding key (URLSearchParams 자동 인코딩 — 이중 인코딩 회피)
 * - 재시도: 5xx + 네트워크 오류만 3회 (200/400/800ms 백오프). 4xx는 즉시 throw.
 * - cache: "no-store" — KYC 응답은 캐싱 금지.
 *
 * 참조: L-027 (encrypted env 검증은 실제 동작이 source of truth), Epic 9 D3.
 */
import "server-only";
import {
  ntsValidateRequestSchema,
  ntsValidateResponseSchema,
  type NtsValidateBusiness,
  type NtsValidateData,
} from "@hesya/shared-types";
import { env } from "@/shared/config/env";

const NTS_BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";
const TIMEOUT_MS = 5_000;
const MAX_RETRIES = 3;

export class NtsApiError extends Error {
  readonly statusCode?: number;
  constructor(message: string, cause?: unknown, statusCode?: number) {
    super(message);
    this.name = "NtsApiError";
    this.statusCode = statusCode;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function postWithRetry(
  url: string,
  body: unknown,
  attempt = 1,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // 외부 응답 본문은 클라이언트로 노출하지 않음 (서버 IP·내부 경로 누출 방지).
      // 디버깅 필요 시 서버 로그(Sentry/Vercel)에서 확인.
      const text = await res.text().catch(() => "");
      console.warn(
        `[nts-client] HTTP ${res.status} body: ${text.slice(0, 500)}`,
      );
      throw new NtsApiError(
        `NTS API HTTP ${res.status}`,
        undefined,
        res.status,
      );
    }
    return (await res.json()) as unknown;
  } catch (err) {
    if (
      err instanceof NtsApiError &&
      err.statusCode !== undefined &&
      err.statusCode >= 400 &&
      err.statusCode < 500
    ) {
      throw err;
    }
    if (attempt >= MAX_RETRIES) {
      throw err instanceof NtsApiError
        ? err
        : new NtsApiError("NTS API 호출 실패 (재시도 한도 초과)", err);
    }
    await sleep(200 * 2 ** (attempt - 1));
    return postWithRetry(url, body, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

export async function validateBusinessNumber(
  input: NtsValidateBusiness,
): Promise<NtsValidateData> {
  const reqBody = ntsValidateRequestSchema.parse({ businesses: [input] });
  const params = new URLSearchParams({ serviceKey: env.KOREA_NTS_API_KEY });
  const url = `${NTS_BASE_URL}/validate?${params.toString()}`;

  const raw = await postWithRetry(url, reqBody);
  const parsed = ntsValidateResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new NtsApiError(
      `NTS 응답 스키마 불일치: ${parsed.error.message}`,
      parsed.error,
    );
  }

  const first = parsed.data.data[0];
  if (!first) {
    throw new NtsApiError("NTS 응답 data 비어 있음");
  }
  return first;
}
