/**
 * Epic 9 § Step 1·2 — KYC Server Actions (NTS 진위확인 + LOCALDATA 검색).
 *
 * 인가 체인: requireAdminEmail (admin 화이트리스트) → checkRateLimit (60s/20회)
 *           → Zod 입력 검증 → 외부 API 호출 → 결과 union 반환.
 *
 * - admin 가드: ADMIN_EMAILS env 화이트리스트 (Epic 12 admin panel 도입 시
 *   role-based로 admin-guard.ts만 교체).
 * - rate limit: data.go.kr 일일 10,000회 한도 보호. in-memory store
 *   (Vercel serverless에서 인스턴스 분리 한계 있음, 부분 방어).
 * - 결과 union: 호출자가 ok 분기로 처리, throw 안 함.
 * - 에러 메시지: 외부 응답 본문은 서버 로그로만, 클라이언트엔 일반화된 메시지.
 */
"use server";

import { storeVerifications, createDbClient, eq } from "@hesya/database";
import {
  localdataSearchInputSchema,
  ntsValidateBusinessSchema,
  NTS_VALID_OK,
  type LocaldataItem,
  type MatchScoreResult,
} from "@hesya/shared-types";
import { z } from "zod";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { env } from "@/shared/config/env";
import { LocaldataApiError, searchBeautyShops } from "./localdata-client";
import { NtsApiError, validateBusinessNumber } from "./nts-client";
import { computeMatchScore } from "./match-score";
import { normalizeBusinessName } from "./normalize-business-name";
import { sendKycNotification } from "@/lib/notifications/kyc-result";

const db = createDbClient(env.DATABASE_URL);

const RATE_LIMIT = { max: 20, windowSec: 60 } as const;

export type VerifyBusinessNumberResult =
  | {
      ok: true;
      validationResult: "valid_match" | "valid_mismatch";
      validCode: string;
      ntsStatus: string | null;
      ntsTaxType: string | null;
      verificationId: string;
    }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "nts_api_error"
        | "internal";
      message: string;
    };

export async function verifyBusinessNumber(
  rawInput: unknown,
): Promise<VerifyBusinessNumberResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }

  try {
    await checkRateLimit(`kyc:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const parsed = ntsValidateBusinessSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  let ntsData;
  try {
    ntsData = await validateBusinessNumber(parsed.data);
  } catch (err) {
    return {
      ok: false,
      error: "nts_api_error",
      message:
        err instanceof NtsApiError
          ? `NTS API 오류 (HTTP ${err.statusCode ?? "unknown"})`
          : "NTS API 호출 중 알 수 없는 오류",
    };
  }

  const validationResult: "valid_match" | "valid_mismatch" =
    ntsData.valid === NTS_VALID_OK ? "valid_match" : "valid_mismatch";

  const startDateIso = `${parsed.data.start_dt.slice(0, 4)}-${parsed.data.start_dt.slice(4, 6)}-${parsed.data.start_dt.slice(6, 8)}`;

  const [row] = await db
    .insert(storeVerifications)
    .values({
      businessNumber: parsed.data.b_no,
      representativeName: parsed.data.p_nm,
      startDate: startDateIso,
      ntsValidationResult: validationResult,
      ntsStatus: ntsData.status?.b_stt ?? null,
      ntsTaxType: ntsData.status?.tax_type ?? null,
    })
    .returning({ id: storeVerifications.id });

  if (!row) {
    return {
      ok: false,
      error: "internal",
      message: "store_verifications INSERT 실패",
    };
  }

  // E9-9: NTS 진위확인 실패 시 즉시 거절 알림 (KYC step 1만 fail = auto_rejected).
  // 수신자는 admin email — Epic 12 매장 owner 가드 도입 시 매장 사장 email로 교체.
  // storeName은 NTS가 사업장명 안 줘서 대표자명을 fallback으로 표기.
  if (validationResult === "valid_mismatch") {
    await sendKycNotification({
      to: guard.email,
      kind: "auto_rejected_nts",
      locale: "ko",
      storeName: parsed.data.p_nm,
      reason: `NTS valid 코드 ${ntsData.valid}`,
    });
  }

  return {
    ok: true,
    validationResult,
    validCode: ntsData.valid,
    ntsStatus: ntsData.status?.b_stt ?? null,
    ntsTaxType: ntsData.status?.tax_type ?? null,
    verificationId: row.id,
  };
}

/**
 * LOCALDATA 미용업 영업신고 조회 (skeleton). 사업자번호 직접 검색 미지원이라
 * 사업장명·도로명주소 LIKE로 후보 조회. 매칭/DB 저장은 다음 분해 단계.
 */
export type SearchLocaldataResult =
  | {
      ok: true;
      items: LocaldataItem[];
      totalCount: number | null;
      pageNo: number | null;
      numOfRows: number | null;
    }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "localdata_api_error";
      message: string;
    };

export async function searchLocaldataBeautyShops(
  rawInput: unknown,
): Promise<SearchLocaldataResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }

  try {
    await checkRateLimit(`kyc:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const parsed = localdataSearchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  try {
    const result = await searchBeautyShops(parsed.data);
    return {
      ok: true,
      items: result.items,
      totalCount: result.totalCount,
      pageNo: result.pageNo,
      numOfRows: result.numOfRows,
    };
  } catch (err) {
    return {
      ok: false,
      error: "localdata_api_error",
      message:
        err instanceof LocaldataApiError
          ? `LOCALDATA API 오류 (HTTP ${err.statusCode ?? "unknown"})`
          : "LOCALDATA API 호출 중 알 수 없는 오류",
    };
  }
}

/**
 * Epic 9 § Step 1·2 통합 — verifyBusinessNumber 결과(verificationId)에 대해
 * LOCALDATA 후보 검색 + 퍼지 매칭 + store_verifications UPDATE.
 *
 * 흐름:
 *   1. admin 가드 + rate limit
 *   2. Zod 입력 검증 (verificationId UUID + bplcNm + roadNmAddr)
 *   3. 빈 입력 가드 (정규화 후 사업장명 빈 문자열이면 invalid_input —
 *      MatchScoreInput 양쪽 null이면 matched=true 회피)
 *   4. searchBeautyShops 호출 → 후보 N개
 *   5. 각 후보에 computeMatchScore → 최고 점수 선택
 *   6. UPDATE store_verifications SET localdata_matched/business_type/status
 *
 * 후보 0건도 정상 흐름 — matched=false + bestScore=0으로 반환.
 */
const matchStoreInputSchema = z.object({
  verificationId: z.string().uuid("verificationId는 UUID"),
  bplcNm: z.string().trim().min(1, "사업장명 필수"),
  roadNmAddr: z.string().trim().optional(),
});

export type MatchStoreToLocaldataResult =
  | {
      ok: true;
      matched: boolean;
      bestScore: MatchScoreResult | null;
      candidate: LocaldataItem | null;
      candidatesCount: number;
      verificationId: string;
    }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "localdata_api_error"
        | "verification_not_found"
        | "internal";
      message: string;
    };

export async function matchStoreToLocaldata(
  rawInput: unknown,
): Promise<MatchStoreToLocaldataResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }

  try {
    await checkRateLimit(`kyc:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const parsed = matchStoreInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  // 빈 입력 가드 — 리뷰 spec (computeMatchScore가 양쪽 null이면 matched=true
  // 반환하는 동작을 호출자 레벨에서 차단)
  if (normalizeBusinessName(parsed.data.bplcNm) === "") {
    return {
      ok: false,
      error: "invalid_input",
      message: "사업장명 정규화 후 빈 문자열",
    };
  }

  // verificationId 존재 확인 (UPDATE 대상 row 사전 검증)
  const existing = await db
    .select({ id: storeVerifications.id })
    .from(storeVerifications)
    .where(eq(storeVerifications.id, parsed.data.verificationId))
    .limit(1);

  if (existing.length === 0) {
    return {
      ok: false,
      error: "verification_not_found",
      message: `verificationId ${parsed.data.verificationId} 없음`,
    };
  }

  let searchResult;
  try {
    searchResult = await searchBeautyShops({
      bplcNm: parsed.data.bplcNm,
      roadNmAddr: parsed.data.roadNmAddr,
      pageNo: 1,
      numOfRows: 50,
    });
  } catch (err) {
    return {
      ok: false,
      error: "localdata_api_error",
      message:
        err instanceof LocaldataApiError
          ? `LOCALDATA API 오류 (HTTP ${err.statusCode ?? "unknown"})`
          : "LOCALDATA API 호출 중 알 수 없는 오류",
    };
  }

  // 각 후보에 매칭 점수 계산, 최고점 선택
  let bestScore: MatchScoreResult | null = null;
  let bestCandidate: LocaldataItem | null = null;

  for (const item of searchResult.items) {
    const score = computeMatchScore({
      ntsName: parsed.data.bplcNm,
      ntsAddress: parsed.data.roadNmAddr,
      localdataName: item.BPLC_NM,
      localdataAddress: item.ROAD_NM_ADDR,
    });
    if (!bestScore || score.totalScore > bestScore.totalScore) {
      bestScore = score;
      bestCandidate = item;
    }
  }

  const matched = bestScore?.matched ?? false;

  await db
    .update(storeVerifications)
    .set({
      localdataMatched: matched,
      localdataBusinessType: bestCandidate?.OPN_ATMY_GRP_CD ?? null,
      localdataStatus: bestCandidate?.SALS_STTS_CD ?? null,
      // E9-10 cron 재검증 시 LOCALDATA에 다시 검색하기 위해 키 저장
      localdataBplcNm: bestCandidate?.BPLC_NM ?? null,
      localdataRoadNmAddr: bestCandidate?.ROAD_NM_ADDR ?? null,
      // 다음 재검증 예약: 분기별(90일) — D7 결정, Phase 1.5에서 정밀화 예약
      nextRevalidationDue: matched
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        : null,
      lastRevalidationAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(storeVerifications.id, parsed.data.verificationId));

  // E9-9: matched=true면 자동 승인 알림, false면 매뉴얼 검토 큐 알림.
  // 수신자는 admin email — Epic 12 매장 owner 가드 도입 시 자연 교체.
  await sendKycNotification({
    to: guard.email,
    kind: matched ? "auto_approved" : "manual_review_queued",
    locale: "ko",
    storeName: parsed.data.bplcNm,
    reason: matched
      ? undefined
      : `LOCALDATA 매칭 점수 ${bestScore?.totalScore.toFixed(3) ?? "0.000"} < 0.85`,
  });

  return {
    ok: true,
    matched,
    bestScore,
    candidate: bestCandidate,
    candidatesCount: searchResult.items.length,
    verificationId: parsed.data.verificationId,
  };
}
