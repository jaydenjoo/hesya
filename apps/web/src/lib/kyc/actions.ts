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
import { logKycEvent, createDrizzleAuditRepo } from "./audit-log";
import { scanForDangerKeywords } from "./keyword-scan";
import {
  signSelfDeclaration,
  createDrizzleSelfDeclarationRepo,
  type SignSelfDeclarationResult,
} from "./self-declaration";
import {
  classifyStoreCategory,
  type ClassifyStoreCategoryHelperResult,
} from "./category-classifier";
import { createAnthropicCategoryRepo } from "@/lib/llm/anthropic-category-repo";

const db = createDbClient(env.DATABASE_URL);
const auditRepo = createDrizzleAuditRepo(db);
const selfDeclarationRepo = createDrizzleSelfDeclarationRepo(db);
const categoryClassifierRepo = createAnthropicCategoryRepo();

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

  // E9-12: NTS 호출 결과 + (실패 시) status_change 감사 로그
  await logKycEvent({
    repo: auditRepo,
    verificationId: row.id,
    eventType: "nts_check",
    eventData: {
      b_no: parsed.data.b_no,
      validCode: ntsData.valid,
      status: ntsData.status?.b_stt ?? null,
      taxType: ntsData.status?.tax_type ?? null,
      validationResult,
    },
    actorUserId: guard.userId,
  });

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
    await logKycEvent({
      repo: auditRepo,
      verificationId: row.id,
      eventType: "notification_sent",
      eventData: { kind: "auto_rejected_nts", to: guard.email },
      actorUserId: guard.userId,
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
      keywordScanPassed: boolean;
      flaggedKeywords: string[];
      finalApproved: boolean;
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

  // E9-7 위험 키워드 검사: 매장 입력 bplcNm + LOCALDATA matched 후보 BPLC_NM
  // 둘 다. PRD § Not Doing 카테고리(마사지·스파·한방·의료기기·성인) 포함 시
  // manual_review로 강등.
  const keywordScan = scanForDangerKeywords([
    parsed.data.bplcNm,
    bestCandidate?.BPLC_NM,
  ]);

  // 매칭 통과 + 키워드 통과 → auto_approved. 둘 중 하나만 fail → manual_review.
  const finalApproved = matched && keywordScan.passed;

  await db
    .update(storeVerifications)
    .set({
      localdataMatched: matched,
      localdataBusinessType: bestCandidate?.OPN_ATMY_GRP_CD ?? null,
      localdataStatus: bestCandidate?.SALS_STTS_CD ?? null,
      // E9-10 cron 재검증 시 LOCALDATA에 다시 검색하기 위해 키 저장
      localdataBplcNm: bestCandidate?.BPLC_NM ?? null,
      localdataRoadNmAddr: bestCandidate?.ROAD_NM_ADDR ?? null,
      // E9-7 위험 키워드 검사 결과 (PRD § 7 컬럼 활용)
      keywordScanPassed: keywordScan.passed,
      flaggedKeywords:
        keywordScan.flagged.length > 0 ? keywordScan.flagged : null,
      // 다음 재검증 예약: 분기별(90일) — D7 결정, Phase 1.5에서 정밀화 예약
      nextRevalidationDue: finalApproved
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        : null,
      lastRevalidationAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(storeVerifications.id, parsed.data.verificationId));

  // E9-12: LOCALDATA 매칭 결과 + keyword_scan + status_change 감사 로그
  await logKycEvent({
    repo: auditRepo,
    verificationId: parsed.data.verificationId,
    eventType: "localdata_match",
    eventData: {
      bplcNm: parsed.data.bplcNm,
      roadNmAddr: parsed.data.roadNmAddr ?? null,
      candidatesCount: searchResult.items.length,
      bestNameScore: bestScore?.nameScore ?? null,
      bestAddressScore: bestScore?.addressScore ?? null,
      bestTotalScore: bestScore?.totalScore ?? null,
      matched,
      bestCandidate: bestCandidate
        ? {
            BPLC_NM: bestCandidate.BPLC_NM,
            ROAD_NM_ADDR: bestCandidate.ROAD_NM_ADDR,
          }
        : null,
    },
    actorUserId: guard.userId,
  });
  await logKycEvent({
    repo: auditRepo,
    verificationId: parsed.data.verificationId,
    eventType: "keyword_scan",
    eventData: {
      passed: keywordScan.passed,
      flagged: keywordScan.flagged,
      checkedTexts: [parsed.data.bplcNm, bestCandidate?.BPLC_NM ?? null],
    },
    actorUserId: guard.userId,
  });

  // 결정 사유: 매칭 fail or 키워드 fail (둘 다 fail 시 둘 다 표기)
  const failReasons: string[] = [];
  if (!matched) {
    failReasons.push(
      `LOCALDATA 매칭 점수 ${bestScore?.totalScore.toFixed(3) ?? "0.000"} < 0.85`,
    );
  }
  if (!keywordScan.passed) {
    failReasons.push(`위험 키워드 감지: ${keywordScan.flagged.join(", ")}`);
  }
  await logKycEvent({
    repo: auditRepo,
    verificationId: parsed.data.verificationId,
    eventType: "status_change",
    eventData: {
      to: finalApproved ? "auto_approved" : "manual_review",
      reason: finalApproved
        ? "LOCALDATA 매칭 + 키워드 검사 통과"
        : failReasons.join("; "),
    },
    actorUserId: guard.userId,
  });

  // E9-9: 알림 — 통과 시 auto_approved, 키워드 또는 매칭 fail 시 manual_review_queued.
  // 수신자는 admin email — Epic 12 매장 owner 가드 도입 시 자연 교체.
  const notifyKind = finalApproved ? "auto_approved" : "manual_review_queued";
  await sendKycNotification({
    to: guard.email,
    kind: notifyKind,
    locale: "ko",
    storeName: parsed.data.bplcNm,
    reason: finalApproved ? undefined : failReasons.join("; "),
  });
  await logKycEvent({
    repo: auditRepo,
    verificationId: parsed.data.verificationId,
    eventType: "notification_sent",
    eventData: { kind: notifyKind, to: guard.email },
    actorUserId: guard.userId,
  });

  return {
    ok: true,
    matched,
    bestScore,
    candidate: bestCandidate,
    candidatesCount: searchResult.items.length,
    verificationId: parsed.data.verificationId,
    keywordScanPassed: keywordScan.passed,
    flaggedKeywords: keywordScan.flagged,
    finalApproved,
  };
}

/**
 * Epic 9 § Step 4 — 약관 자기신고.
 *
 * 매장 사장이 가입 시 "마사지·의료기기·한방 시술 안 함" 3개 모두 동의.
 * 자기신고 자체는 status 변경 X (단순 동의 기록 + audit log).
 * 5단계 종합 결과는 admin panel(Epic 12)에서 운영자가 확인.
 *
 * 인가: requireAdminEmail (E9-3·E9-12 동일 정책 — Epic 12에서 owner guard 교체).
 *
 * 결과 union:
 *   - ok=true: 신규 서명 성공
 *   - declaration_incomplete: 3개 중 하나라도 false (가입 자격 없음)
 *   - already_signed: immutable (재서명 차단)
 *   - invalid_input: Zod 검증 실패
 */
export type SignSelfDeclarationActionResult =
  | SignSelfDeclarationResult
  | {
      ok: false;
      error: "unauthorized" | "forbidden" | "rate_limited";
      message: string;
    };

export async function signSelfDeclarationAction(
  rawInput: unknown,
): Promise<SignSelfDeclarationActionResult> {
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

  // 입력 형태가 Zod 검증 실패할 수 있어 unknown 그대로 helper에 위임
  const result = await signSelfDeclaration({
    repo: selfDeclarationRepo,
    // 안전한 캐스팅 — helper가 Zod로 재검증
    ...((rawInput ?? {}) as {
      verificationId: string;
      declarations: {
        noMassage: boolean;
        noMedicalDevice: boolean;
        noOrientalMedicine: boolean;
      };
    }),
  });

  // E9-12 audit log: 결과와 무관하게 시도 자체를 기록 (법적 책임 추적)
  if (result.ok) {
    await logKycEvent({
      repo: auditRepo,
      verificationId: result.verificationId,
      eventType: "self_declaration",
      eventData: {
        signedAt: result.signedAt.toISOString(),
        declarations: {
          noMassage: true,
          noMedicalDevice: true,
          noOrientalMedicine: true,
        },
      },
      actorUserId: guard.userId,
    });
  }

  return result;
}

/**
 * Epic 9 § Step 3 (E9-4) — 카테고리 자동 분류.
 *
 * 입력 = verificationId. store_verifications에서 LOCALDATA 매칭 결과
 * (bplcNm, localdata_bplc_nm, localdata_business_type) 가져와 LLM 분류.
 * 결과 = 9개 카테고리 중 1개 + confidence. < 0.85 → manual_review 후속.
 *
 * 자체 status 변경 X (E9-5와 동일 — admin이 5단계 종합 판단).
 * categoryClassified + categoryConfidence UPDATE + audit log만.
 */
const classifyCategoryInputSchema = z.object({
  verificationId: z.string().uuid("verificationId는 UUID"),
});

export type ClassifyCategoryActionResult =
  | (ClassifyStoreCategoryHelperResult & { ok: true; verificationId: string })
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "verification_not_found"
        | "verification_missing_input"
        | "llm_invalid_response"
        | "llm_error";
      message: string;
    };

export async function classifyStoreCategoryAction(
  rawInput: unknown,
): Promise<ClassifyCategoryActionResult> {
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

  const parsed = classifyCategoryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  // store_verifications에서 분류 입력 가져오기
  const [row] = await db
    .select({
      id: storeVerifications.id,
      businessNumber: storeVerifications.businessNumber,
      localdataBplcNm: storeVerifications.localdataBplcNm,
      localdataBusinessType: storeVerifications.localdataBusinessType,
    })
    .from(storeVerifications)
    .where(eq(storeVerifications.id, parsed.data.verificationId))
    .limit(1);

  if (!row) {
    return {
      ok: false,
      error: "verification_not_found",
      message: `verificationId ${parsed.data.verificationId} 없음`,
    };
  }

  // 분류 입력 = LOCALDATA 매칭이 있으면 그 사업장명, 아니면 representativeName fallback
  // 정확도 떨어지므로 verification에 명시적 입력 컬럼 추가는 Phase 1.5
  const bplcNm = row.localdataBplcNm ?? row.businessNumber;
  if (!bplcNm) {
    return {
      ok: false,
      error: "verification_missing_input",
      message: "분류 입력 (localdataBplcNm 또는 businessNumber) 누락",
    };
  }

  const result = await classifyStoreCategory({
    repo: categoryClassifierRepo,
    input: {
      bplcNm,
      localdataBplcNm: row.localdataBplcNm,
      localdataOpnAtmyGrpCd: row.localdataBusinessType,
    },
  });

  if (!result.ok) {
    return result;
  }

  // store_verifications UPDATE
  await db
    .update(storeVerifications)
    .set({
      categoryClassified: result.category,
      categoryConfidence: result.confidence.toString(),
      updatedAt: new Date(),
    })
    .where(eq(storeVerifications.id, parsed.data.verificationId));

  // E9-12 audit log
  await logKycEvent({
    repo: auditRepo,
    verificationId: parsed.data.verificationId,
    eventType: "category_classify",
    eventData: {
      category: result.category,
      confidence: result.confidence,
      autoClassified: result.autoClassified,
      reasoning: result.reasoning ?? null,
    },
    actorUserId: guard.userId,
  });

  return { ...result, verificationId: parsed.data.verificationId };
}
