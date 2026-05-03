/**
 * E9-6 영업신고증 OCR 추출 helper.
 *
 * PRD § 5.4 Step 4-2 — Vision API로 영업신고증 사진에서 4개 필드(사업자번호·
 * 대표자명·주소·개업일자) 추출 후 NTS/LOCALDATA 매칭에 자동 입력.
 *
 * 출력 = 4개 필드 + confidence (< OCR_CONFIDENCE_THRESHOLD 0.85 → manual_review).
 *
 * Repository pattern: VisionExtractorRepo로 LLM 호출 분리 → 단위 테스트는
 * mock 응답으로 검증, production은 createAnthropicVisionRepo()로 주입.
 */
import "server-only";
import { z } from "zod";
import {
  OCR_CONFIDENCE_THRESHOLD,
  type OcrExtractResult,
  type OcrExtractedData,
} from "@hesya/shared-types";

export interface VisionExtractorRepo {
  extract: (input: {
    imageBase64: string;
    mediaType: SupportedMediaType;
  }) => Promise<OcrExtractResult>;
}

export const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

// imageBase64 max size 검증은 호출자(Server Action)에서 수행 — Anthropic Vision
// API 단일 이미지 한도 ~5MB(base64 인코딩 후 ~6.7MB). helper 레벨에선 형식만 검증.
export const extractOcrInputSchema = z.object({
  imageBase64: z.string().min(1, "imageBase64 빈 문자열 불가"),
  mediaType: z.enum(SUPPORTED_MEDIA_TYPES),
});
export type ExtractOcrInput = z.infer<typeof extractOcrInputSchema>;

export type ExtractOcrHelperResult =
  | {
      ok: true;
      extracted: OcrExtractedData;
      confidence: number;
      autoExtracted: boolean;
    }
  | {
      ok: false;
      error: "invalid_input" | "vision_invalid_response" | "vision_error";
      message: string;
    };

interface HelperInput {
  repo: VisionExtractorRepo;
  input: ExtractOcrInput;
}

export async function extractOcrFromLicense(
  args: HelperInput,
): Promise<ExtractOcrHelperResult> {
  const parsed = extractOcrInputSchema.safeParse(args.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  let visionResult: OcrExtractResult;
  try {
    visionResult = await args.repo.extract(parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("invalid JSON")) {
      return {
        ok: false,
        error: "vision_invalid_response",
        message: err.message,
      };
    }
    return {
      ok: false,
      error: "vision_error",
      message:
        err instanceof Error ? err.message : "Vision API 호출 알 수 없는 오류",
    };
  }

  return {
    ok: true,
    extracted: visionResult.extracted,
    confidence: visionResult.confidence,
    autoExtracted: visionResult.confidence >= OCR_CONFIDENCE_THRESHOLD,
  };
}
