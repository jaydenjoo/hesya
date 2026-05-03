/**
 * E9-4 매장 카테고리 enum (PRD § 7 line 601~611, stores CHECK 정합).
 *
 * 미용업 5종 (LOCALDATA 영업신고 등록): 가/나/다/라/마
 * 자유업 4종 (LOCALDATA 미등록, 사업자등록만): 퍼스널컬러/메이크업클래스/한복/K팝
 *
 * Phase 1 자동 분류 입력 = 사업장명 + LOCALDATA 사업장명 + OPN_ATMY_GRP_CD.
 * Anthropic Sonnet 4.6이 9개 중 1개 + confidence 반환. < 0.85 → manual_review.
 */
import { z } from "zod";
import { STORE_CATEGORIES } from "./stores";

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

/** Phase 1 분류 임계값. < 0.85 → manual_review (store_verifications 정책 동일). */
export const CATEGORY_CONFIDENCE_THRESHOLD = 0.85;

/** 분류기 입력 — store_verifications row의 LOCALDATA 매칭 결과 + 사업장명. */
export const classifyStoreCategoryInputSchema = z.object({
  bplcNm: z.string().trim().min(1, "사업장명 필수").max(100),
  localdataBplcNm: z.string().trim().max(100).nullish(),
  localdataOpnAtmyGrpCd: z.string().trim().max(20).nullish(),
});

/** 분류기 결과 — LLM이 JSON으로 반환해야 하는 형태. */
export const classifyStoreCategoryResultSchema = z.object({
  category: z.enum(STORE_CATEGORIES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(500).optional(),
});

export type ClassifyStoreCategoryInput = z.infer<
  typeof classifyStoreCategoryInputSchema
>;
export type ClassifyStoreCategoryResult = z.infer<
  typeof classifyStoreCategoryResultSchema
>;
