/**
 * Epic 9 § Step 1 — 사업자등록 진위확인 Server Action.
 *
 * 흐름: Better Auth session 검증 → Zod 입력 검증 → NTS API 호출
 *      → valid 코드 매핑 → store_verifications INSERT (storeId null).
 *
 * 결과는 union 타입 — 호출자가 ok 분기로 명확히 처리. throw 안 함.
 */
"use server";

import { headers } from "next/headers";
import { storeVerifications, createDbClient } from "@hesya/database";
import {
  localdataSearchInputSchema,
  ntsValidateBusinessSchema,
  NTS_VALID_OK,
  type LocaldataItem,
} from "@hesya/shared-types";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { LocaldataApiError, searchBeautyShops } from "./localdata-client";
import { NtsApiError, validateBusinessNumber } from "./nts-client";

const db = createDbClient(env.DATABASE_URL);

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
      error: "unauthorized" | "invalid_input" | "nts_api_error" | "internal";
      message: string;
    };

export async function verifyBusinessNumber(
  rawInput: unknown,
): Promise<VerifyBusinessNumberResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      ok: false,
      error: "unauthorized",
      message: "로그인이 필요합니다",
    };
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
          ? err.message
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
 * Epic 9 § Step 2 — LOCALDATA 미용업 영업신고 조회 Server Action (skeleton).
 *
 * 사업자번호 직접 검색은 미지원이라 사업장명(LIKE) + 도로명주소(LIKE)로 후보 조회.
 * 이번 단계는 검색 결과 list 반환만 — 퍼지 매칭과 store_verifications.localdata_*
 * INSERT는 다음 분해 단계.
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
      error: "unauthorized" | "invalid_input" | "localdata_api_error";
      message: string;
    };

export async function searchLocaldataBeautyShops(
  rawInput: unknown,
): Promise<SearchLocaldataResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      ok: false,
      error: "unauthorized",
      message: "로그인이 필요합니다",
    };
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
      totalCount: result.totalCount ?? null,
      pageNo: result.pageNo ?? null,
      numOfRows: result.numOfRows ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: "localdata_api_error",
      message:
        err instanceof LocaldataApiError
          ? err.message
          : "LOCALDATA API 호출 중 알 수 없는 오류",
    };
  }
}
