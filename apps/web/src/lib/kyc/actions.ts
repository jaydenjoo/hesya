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
import { ntsValidateBusinessSchema, NTS_VALID_OK } from "@hesya/shared-types";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
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
