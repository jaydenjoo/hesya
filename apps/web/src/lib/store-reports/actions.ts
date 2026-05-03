/**
 * Epic 9 § 11 — 외부 신고 접수 Server Action.
 *
 * 인가 체인: requireAdminEmail (Phase 1 admin 검증용) → checkRateLimit (60s/20회)
 *           → submitStoreReport (Zod + storeId 존재 + INSERT) → 결과 union 반환.
 *
 * 공개 폼 (외부인 신고)은 Phase 1.5 reCAPTCHA 도입 후 별도 endpoint로 분리.
 * E12-3 (admin panel)에서 신고 처리(차단/유지) 결정.
 */
"use server";

import { createDbClient } from "@hesya/database";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { env } from "@/shared/config/env";
import {
  submitStoreReport,
  createDrizzleStoreReportRepo,
  type SubmitStoreReportResult,
} from "./submit";

const db = createDbClient(env.DATABASE_URL);
const reportRepo = createDrizzleStoreReportRepo(db);

const RATE_LIMIT = { max: 20, windowSec: 60 } as const;

export type SubmitStoreReportActionResult =
  | SubmitStoreReportResult
  | {
      ok: false;
      error: "unauthorized" | "forbidden" | "rate_limited";
      message: string;
    };

export async function submitStoreReportAction(
  rawInput: unknown,
): Promise<SubmitStoreReportActionResult> {
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }

  try {
    await checkRateLimit(`report:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  // 입력 형태가 Zod 검증 실패할 수 있어 unknown 그대로 helper에 위임
  return submitStoreReport({
    repo: reportRepo,
    ...((rawInput ?? {}) as {
      storeId: string;
      reporterType: "customer" | "competitor" | "staff" | "anonymous";
      reportReason: "illegal_service" | "safety_issue" | "fraud" | "other";
      description: string;
      evidenceUrls?: string[];
    }),
  });
}
