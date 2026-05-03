/**
 * E9-6 영업신고증 OCR 추출 결과 schema (Vision API 응답).
 *
 * PRD § 5.4 Step 4-2. Claude Opus 4.7 Vision (2,576px) 응답 → 4개 필드 + confidence.
 * 자동 통과 임계값 = OCR_CONFIDENCE_THRESHOLD (0.85). 미만이면 manual_review.
 * Phase 1.5에서 데이터 보고 임계값 조정 — D7 정합 (PROGRESS.md 2026-04-30).
 */
import { z } from "zod";

export const OCR_CONFIDENCE_THRESHOLD = 0.85;

export const ocrExtractedDataSchema = z.object({
  businessNumber: z.string().nullable(),
  representativeName: z.string().nullable(),
  address: z.string().nullable(),
  startDate: z.string().nullable(),
});
export type OcrExtractedData = z.infer<typeof ocrExtractedDataSchema>;

export const ocrExtractResultSchema = z.object({
  extracted: ocrExtractedDataSchema,
  confidence: z.number().min(0).max(1),
});
export type OcrExtractResult = z.infer<typeof ocrExtractResultSchema>;
