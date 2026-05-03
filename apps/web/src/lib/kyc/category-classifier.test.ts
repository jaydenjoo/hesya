/**
 * E9-4 카테고리 자동 분류 helper 단위 테스트.
 *
 * helper는 LLM 호출자 (외부 의존). 단위 테스트는 CategoryClassifierRepo mock으로
 * 입력→출력 매핑 + confidence 임계값 + invalid LLM 응답 검증.
 *
 * 실 LLM 정확도는 manual smoke로 검증 (E9-3·E9-9·E9-12 동일 정책).
 */
import { describe, expect, it } from "vitest";
import {
  classifyStoreCategory,
  type CategoryClassifierRepo,
} from "./category-classifier";
import type { ClassifyStoreCategoryResult } from "@hesya/shared-types";

function makeRepo(
  responses: Array<ClassifyStoreCategoryResult | "invalid_response" | Error>,
) {
  let i = 0;
  const calls: Array<{
    bplcNm: string;
    localdataBplcNm?: string | null;
    localdataOpnAtmyGrpCd?: string | null;
  }> = [];
  const repo: CategoryClassifierRepo = {
    classify: async (input) => {
      calls.push(input);
      const r = responses[i++];
      if (r instanceof Error) throw r;
      if (r === "invalid_response") {
        throw new Error("LLM이 invalid JSON 반환");
      }
      return r;
    },
  };
  return { repo, calls };
}

describe("classifyStoreCategory", () => {
  it("미용업 분류 (high confidence) → ok + auto_classified=true", async () => {
    const { repo } = makeRepo([
      { category: "hair_general", confidence: 0.92, reasoning: "헤어/미용실" },
    ]);
    const result = await classifyStoreCategory({
      repo,
      input: {
        bplcNm: "청담살롱",
        localdataBplcNm: "청담살롱",
        localdataOpnAtmyGrpCd: "01",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.category).toBe("hair_general");
      expect(result.confidence).toBe(0.92);
      expect(result.autoClassified).toBe(true);
    }
  });

  it("자유업 분류 (high confidence) → ok", async () => {
    const { repo } = makeRepo([
      { category: "free_personal_color", confidence: 0.88 },
    ]);
    const result = await classifyStoreCategory({
      repo,
      input: { bplcNm: "홍대 퍼스널컬러 진단소" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.category).toBe("free_personal_color");
      expect(result.autoClassified).toBe(true);
    }
  });

  it("low confidence (< 0.85) → autoClassified=false (manual_review 큐)", async () => {
    const { repo } = makeRepo([{ category: "skin_beauty", confidence: 0.62 }]);
    const result = await classifyStoreCategory({
      repo,
      input: { bplcNm: "애매한 이름" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.category).toBe("skin_beauty");
      expect(result.autoClassified).toBe(false);
    }
  });

  it("LLM 응답 schema 위반 → ok=false (llm_invalid_response)", async () => {
    const { repo } = makeRepo(["invalid_response"]);
    const result = await classifyStoreCategory({
      repo,
      input: { bplcNm: "테스트 매장" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("llm_invalid_response");
    }
  });

  it("입력 bplcNm 빈 문자열 → invalid_input + repo 미호출", async () => {
    const { repo, calls } = makeRepo([
      { category: "hair_general", confidence: 0.9 },
    ]);
    const result = await classifyStoreCategory({
      repo,
      input: { bplcNm: "" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(calls).toHaveLength(0);
  });
});
