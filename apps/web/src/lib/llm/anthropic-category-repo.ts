/**
 * E9-4 Anthropic 기반 CategoryClassifierRepo 구현 (production).
 *
 * Sonnet 4.6 호출 → JSON 응답 파싱 → ClassifyStoreCategoryResult 반환.
 * env import는 함수 호출 시점에 lazy load (vitest parse 시점 충돌 방지 — L-035).
 *
 * 비용: 1회 ~$0.003 (input ~500 + output ~150 tokens).
 * 정확도: manual smoke로 측정 (Phase 1.5 데이터 누적 후 평가).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  classifyStoreCategoryResultSchema,
  STORE_CATEGORIES,
  type ClassifyStoreCategoryInput,
  type ClassifyStoreCategoryResult,
} from "@hesya/shared-types";
import type { CategoryClassifierRepo } from "@/lib/kyc/category-classifier";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 300;

const SYSTEM_PROMPT = `한국 뷰티 매장의 카테고리를 분류하는 전문가다. 9개 카테고리 중 1개를 선택하고 confidence를 0~1로 답한다.

미용업 5종 (LOCALDATA 영업신고 등록 매장):
- hair_general: 일반미용업 (헤어/커트/펌)
- skin_beauty: 피부미용업 (페이셜/마사지 X — 의료법 위반 매장은 사전 차단됨)
- nail: 네일미용업 (매니큐어/페디큐어/네일아트)
- makeup: 화장·분장 미용업 (메이크업 전문)
- composite: 종합미용업 (헤어+피부+네일+메이크업 통합)

자유업 4종 (LOCALDATA 미등록, 사업자등록증만):
- free_personal_color: 퍼스널컬러 진단·컨설팅
- free_makeup_class: 메이크업 클래스·강의
- free_hanbok: 한복 체험·대여
- free_kpop_class: K팝 안무·보컬 클래스

응답 형식 (JSON only, 다른 텍스트 X):
{"category":"<위 9개 중 1개>","confidence":<0.0~1.0>,"reasoning":"<짧은 한국어 근거>"}`;

function buildUserPrompt(input: ClassifyStoreCategoryInput): string {
  const lines = [`사업장명: ${input.bplcNm}`];
  if (input.localdataBplcNm) {
    lines.push(`LOCALDATA 사업장명: ${input.localdataBplcNm}`);
  }
  if (input.localdataOpnAtmyGrpCd) {
    lines.push(`LOCALDATA 영업업태코드: ${input.localdataOpnAtmyGrpCd}`);
  } else {
    lines.push(`LOCALDATA 매칭: 없음 (자유업 가능성)`);
  }
  return lines.join("\n");
}

/**
 * Anthropic 응답 → ClassifyStoreCategoryResult 변환.
 * JSON 파싱 실패 / schema 위반 시 throw "invalid JSON ..." (helper가 잡아 llm_invalid_response).
 */
function parseAnthropicResponse(text: string): ClassifyStoreCategoryResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error(`invalid JSON from LLM: ${text.slice(0, 200)}`);
  }
  const result = classifyStoreCategoryResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `invalid JSON shape from LLM: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return result.data;
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  // env import lazy — kyc-result.ts 패턴 동일 (L-035)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require("@/shared/config/env");
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

export function createAnthropicCategoryRepo(): CategoryClassifierRepo {
  return {
    classify: async (input) => {
      const client = getClient();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("invalid JSON from LLM: text block 없음");
      }
      return parseAnthropicResponse(textBlock.text);
    },
  };
}

// 외부 테스트용 — 단위 테스트는 mock 응답으로 검증
export const __test = {
  parseAnthropicResponse,
  buildUserPrompt,
  SYSTEM_PROMPT,
  STORE_CATEGORIES,
};
