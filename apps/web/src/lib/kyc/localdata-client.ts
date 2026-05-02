/**
 * 행정안전부_생활_미용업 조회 클라이언트 (Server-only).
 *
 * - 인증키: Decoding key (URLSearchParams 자동 인코딩 — 이중 인코딩 회피)
 * - 메서드: GET (data.go.kr 1741000 표준)
 * - 검색 키: cond[BPLC_NM::LIKE] / cond[ROAD_NM_ADDR::LIKE]
 *   (사업자번호 검색 미지원 — 사업장명 + 주소로 후보 조회 후 다음 단계 매칭)
 * - 재시도: 5xx + 네트워크 오류만 3회 (200/400/800ms 백오프). 4xx는 즉시 throw.
 * - cache: "no-store"
 *
 * 참조: Epic 9 § Step 2, L-029 (응답 스키마 strict X passthrough O), nts-client.ts 패턴 미러.
 */
import "server-only";
import {
  extractLocaldataItems,
  localdataSearchResponseSchema,
  type LocaldataItem,
  type LocaldataSearchInput,
} from "@hesya/shared-types";
import { env } from "@/shared/config/env";

const LOCALDATA_BASE_URL = "https://apis.data.go.kr/1741000/beauty_salons/info";
const TIMEOUT_MS = 5_000;
const MAX_RETRIES = 3;

export class LocaldataApiError extends Error {
  readonly statusCode?: number;
  constructor(message: string, cause?: unknown, statusCode?: number) {
    super(message);
    this.name = "LocaldataApiError";
    this.statusCode = statusCode;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getWithRetry(url: string, attempt = 1): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // 외부 응답 본문은 클라이언트로 노출하지 않음 (서버 IP·내부 경로 누출 방지).
      // 디버깅 필요 시 서버 로그(Sentry/Vercel)에서 확인.
      const text = await res.text().catch(() => "");
      console.warn(
        `[localdata-client] HTTP ${res.status} body: ${text.slice(0, 500)}`,
      );
      throw new LocaldataApiError(
        `LOCALDATA API HTTP ${res.status}`,
        undefined,
        res.status,
      );
    }
    return (await res.json()) as unknown;
  } catch (err) {
    if (
      err instanceof LocaldataApiError &&
      err.statusCode !== undefined &&
      err.statusCode >= 400 &&
      err.statusCode < 500
    ) {
      throw err;
    }
    if (attempt >= MAX_RETRIES) {
      throw err instanceof LocaldataApiError
        ? err
        : new LocaldataApiError(
            "LOCALDATA API 호출 실패 (재시도 한도 초과)",
            err,
          );
    }
    await sleep(200 * 2 ** (attempt - 1));
    return getWithRetry(url, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

export interface SearchBeautyShopsResult {
  items: LocaldataItem[];
  totalCount: number | null;
  pageNo: number | null;
  numOfRows: number | null;
}

/**
 * 호출자(Server Action)가 이미 Zod 검증된 LocaldataSearchInput을 전달한다고 가정.
 * 이중 검증 없음 — 단일 책임 경계는 Server Action에 둔다.
 */
export async function searchBeautyShops(
  input: LocaldataSearchInput,
): Promise<SearchBeautyShopsResult> {
  const params = new URLSearchParams({
    serviceKey: env.KOREA_LOCALDATA_API_KEY,
    pageNo: String(input.pageNo),
    numOfRows: String(input.numOfRows),
    returnType: "json",
    "cond[BPLC_NM::LIKE]": input.bplcNm,
  });
  if (input.roadNmAddr) {
    params.append("cond[ROAD_NM_ADDR::LIKE]", input.roadNmAddr);
  }

  const url = `${LOCALDATA_BASE_URL}?${params.toString()}`;
  const raw = await getWithRetry(url);
  const parsed = localdataSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new LocaldataApiError(
      `LOCALDATA 응답 스키마 불일치: ${parsed.error.message}`,
      parsed.error,
    );
  }

  return {
    items: extractLocaldataItems(parsed.data),
    totalCount: parsed.data.response?.body?.totalCount ?? null,
    pageNo: parsed.data.response?.body?.pageNo ?? null,
    numOfRows: parsed.data.response?.body?.numOfRows ?? null,
  };
}
