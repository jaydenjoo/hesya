/**
 * E9-4 매장 카테고리 자동 분류 helper.
 *
 * PRD § 5.4 Step 3 — 미용업 5종(가/나/다/라/마) + 자유업 4종 자동 분류.
 * 입력 = 사업장명 + LOCALDATA 매칭 결과 (사업장명 + OPN_ATMY_GRP_CD).
 * 출력 = 카테고리 + confidence (< 0.85 → manual_review).
 *
 * Repository pattern: CategoryClassifierRepo로 LLM 호출 분리 → 단위 테스트는
 * mock 응답으로 검증, production은 createAnthropicCategoryRepo()로 주입.
 */
import "server-only";
import {
  classifyStoreCategoryInputSchema,
  CATEGORY_CONFIDENCE_THRESHOLD,
  type ClassifyStoreCategoryInput,
  type ClassifyStoreCategoryResult,
  type StoreCategory,
} from "@hesya/shared-types";

export interface CategoryClassifierRepo {
  classify: (
    input: ClassifyStoreCategoryInput,
  ) => Promise<ClassifyStoreCategoryResult>;
}

export type ClassifyStoreCategoryHelperResult =
  | {
      ok: true;
      category: StoreCategory;
      confidence: number;
      autoClassified: boolean;
      reasoning?: string;
    }
  | {
      ok: false;
      error: "invalid_input" | "llm_invalid_response" | "llm_error";
      message: string;
    };

interface HelperInput {
  repo: CategoryClassifierRepo;
  input: ClassifyStoreCategoryInput;
}

export async function classifyStoreCategory(
  args: HelperInput,
): Promise<ClassifyStoreCategoryHelperResult> {
  const parsed = classifyStoreCategoryInputSchema.safeParse(args.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  let llmResult: ClassifyStoreCategoryResult;
  try {
    llmResult = await args.repo.classify(parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("invalid JSON")) {
      return {
        ok: false,
        error: "llm_invalid_response",
        message: err.message,
      };
    }
    return {
      ok: false,
      error: "llm_error",
      message: err instanceof Error ? err.message : "LLM 호출 알 수 없는 오류",
    };
  }

  return {
    ok: true,
    category: llmResult.category,
    confidence: llmResult.confidence,
    autoClassified: llmResult.confidence >= CATEGORY_CONFIDENCE_THRESHOLD,
    reasoning: llmResult.reasoning,
  };
}
