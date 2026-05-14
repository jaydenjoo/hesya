"use server";

/**
 * Plan v4 Epic B — AI Photo Analysis Server Action.
 *
 * 흐름:
 *   1. FormData에서 file/storeId 추출 + 검증
 *   2. rate-limit 체크 (anonymous IP 또는 customer id 기준, 10건/시간)
 *   3. photo_analyses row 생성 (status=pending, image_url=sha256 hash)
 *   4. base64 변환 → Claude Opus 4.7 Vision 호출
 *   5. 성공 시 result 채움 + status=completed
 *   6. 실패 시 errorMessage + status=failed
 *
 * Image 자체는 DB에 저장 안 함 (sha256 hash만). 분석 직후 메모리에서 폐기.
 * 추후 Supabase Storage 도입 시 image_url을 hash → bucket key로 교체.
 */

import { createHash } from "node:crypto";
import { createDbClient } from "@hesya/database";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import {
  completePhotoAnalysis,
  createPhotoAnalysis,
  failPhotoAnalysis,
  getPhotoAnalysisById,
  setPhotoAnalysisAnalyzing,
} from "@/shared/lib/dal/photo-analyses";
import { headers } from "next/headers";

import { analyzePhotoStyle } from "./analyze";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB (Opus Vision 2,576px 충분)
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedType = (typeof ACCEPTED_TYPES)[number];

const inputSchema = z.object({
  storeId: z.string().uuid().optional(),
});

export interface AnalyzePhotoActionResult {
  readonly ok: true;
  readonly analysisId: string;
  readonly styleName: string;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly estimatedMinutes: number;
  readonly compatibilityNote: string;
  readonly confidence: number;
}

export interface AnalyzePhotoActionError {
  readonly ok: false;
  readonly errorCode:
    | "no_file"
    | "invalid_type"
    | "too_large"
    | "invalid_input"
    | "rate_limited"
    | "vision_failed"
    | "internal";
  readonly message: string;
  readonly retryAfterSec?: number;
}

export async function analyzePhotoAction(
  formData: FormData,
): Promise<AnalyzePhotoActionResult | AnalyzePhotoActionError> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, errorCode: "no_file", message: "no file provided" };
  }
  if (!ACCEPTED_TYPES.includes(file.type as AcceptedType)) {
    return {
      ok: false,
      errorCode: "invalid_type",
      message: `unsupported file type: ${file.type}`,
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, errorCode: "too_large", message: "file > 8 MB" };
  }

  const storeIdRaw = formData.get("storeId");
  const parsed = inputSchema.safeParse({
    storeId: typeof storeIdRaw === "string" ? storeIdRaw : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "invalid input",
    };
  }

  const ipHeaders = await headers();
  const ip =
    ipHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ipHeaders.get("x-real-ip") ??
    "anon";

  try {
    await checkRateLimit(`photo-analyze:${ip}`, { max: 10, windowSec: 3600 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        ok: false,
        errorCode: "rate_limited",
        message: "rate limit exceeded",
        retryAfterSec: err.retryAfterSec,
      };
    }
    throw err;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const imageUrl = `hash:sha256:${hash}`; // Supabase Storage 도입 시 교체

  const db = createDbClient(env.DATABASE_URL);
  const analysisId = await createPhotoAnalysis(db, {
    storeId: parsed.data.storeId ?? null,
    imageUrl,
  });

  await setPhotoAnalysisAnalyzing(db, analysisId);

  try {
    const result = await analyzePhotoStyle({
      imageBase64: Buffer.from(bytes).toString("base64"),
      mediaType: file.type as AcceptedType,
    });
    await completePhotoAnalysis(db, analysisId, {
      styleName: result.styleName,
      difficulty: result.difficulty,
      estimatedMinutes: result.estimatedMinutes,
      compatibilityNote: result.compatibilityNote,
      confidence: result.confidence,
      resultJsonb: result,
    });
    return {
      ok: true,
      analysisId,
      styleName: result.styleName,
      difficulty: result.difficulty,
      estimatedMinutes: result.estimatedMinutes,
      compatibilityNote: result.compatibilityNote,
      confidence: result.confidence,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message.slice(0, 500) : "unknown vision error";
    await failPhotoAnalysis(db, analysisId, message);
    return {
      ok: false,
      errorCode: "vision_failed",
      message: "Vision API analysis failed",
    };
  }
}

export async function getAnalysisAction(
  id: string,
): Promise<AnalyzePhotoActionResult | AnalyzePhotoActionError> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { ok: false, errorCode: "invalid_input", message: "invalid id" };
  }
  const db = createDbClient(env.DATABASE_URL);
  const row = await getPhotoAnalysisById(db, id);
  if (!row) {
    return { ok: false, errorCode: "internal", message: "not found" };
  }
  if (row.status !== "completed") {
    return {
      ok: false,
      errorCode: row.status === "failed" ? "vision_failed" : "internal",
      message: row.errorMessage ?? "analysis not completed",
    };
  }
  if (
    !row.styleName ||
    !row.difficulty ||
    row.estimatedMinutes == null ||
    !row.compatibilityNote ||
    row.confidence == null
  ) {
    return {
      ok: false,
      errorCode: "internal",
      message: "result fields missing",
    };
  }
  return {
    ok: true,
    analysisId: row.id,
    styleName: row.styleName,
    difficulty: row.difficulty as "easy" | "medium" | "hard",
    estimatedMinutes: row.estimatedMinutes,
    compatibilityNote: row.compatibilityNote,
    confidence: row.confidence,
  };
}
