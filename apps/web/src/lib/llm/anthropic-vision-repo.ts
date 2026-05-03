/**
 * E9-6 Anthropic 기반 VisionExtractorRepo 구현 (production).
 *
 * Claude Opus 4.7 Vision (PRD §509: 2,576px 고해상도) 호출 → JSON 응답 파싱
 * → OcrExtractResult 반환.
 *
 * 비용: 1회 ~$0.015 (PRD §1028, 1MB JPEG 기준).
 *
 * `task_budget` (PRD §509)은 thinking budget 도입 시 활성화 — 현재 plain
 * messages 모드. Phase 1.5에서 정확도 데이터 보고 thinking 적용 검토.
 *
 * env import는 호출 시점 lazy load (L-035, anthropic-category-repo.ts 패턴 동일).
 *
 * 정확도: manual smoke로 측정 (E9-3·E9-4·E9-9·E9-12 동일 정책).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ocrExtractResultSchema,
  type OcrExtractResult,
} from "@hesya/shared-types";
import type { VisionExtractorRepo } from "@/lib/kyc/ocr-extractor";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `한국 영업신고증·사업자등록증 사진을 정확하게 분석하는 전문가다. 4개 필드를 추출하고 confidence를 0~1로 답한다.

추출 필드:
- businessNumber: 사업자등록번호 10자리 (하이픈 제거, 예: "1234567890")
- representativeName: 대표자명 (한글 그대로)
- address: 사업장 소재지 도로명·지번 주소 (원문 그대로, 줄임 없이)
- startDate: 개업일자 (YYYY-MM-DD 형식)

읽을 수 없는 필드는 null. 사진 흐림·일부 가림으로 자신 없으면 confidence를 낮게 (0.85 미만 → 매뉴얼 검토 큐로 전송됨).

응답 형식 (JSON only, 다른 텍스트 X):
{"extracted":{"businessNumber":"<10자리|null>","representativeName":"<한글|null>","address":"<원문|null>","startDate":"<YYYY-MM-DD|null>"},"confidence":<0.0~1.0>}`;

const USER_PROMPT =
  "이 영업신고증·사업자등록증 사진에서 4개 필드를 추출해주세요.";

function parseAnthropicResponse(text: string): OcrExtractResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error(`invalid JSON from Vision: ${text.slice(0, 200)}`);
  }
  const result = ocrExtractResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `invalid JSON shape from Vision: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return result.data;
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  // env import lazy — kyc-result.ts / anthropic-category-repo.ts 패턴 동일 (L-035)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require("@/shared/config/env");
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

export function createAnthropicVisionRepo(): VisionExtractorRepo {
  return {
    extract: async ({ imageBase64, mediaType }) => {
      const client = getClient();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              { type: "text", text: USER_PROMPT },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("invalid JSON from Vision: text block 없음");
      }
      return parseAnthropicResponse(textBlock.text);
    },
  };
}

// 외부 테스트용 — 단위 테스트는 mock 응답으로 검증
export const __test = {
  parseAnthropicResponse,
  SYSTEM_PROMPT,
  MODEL,
};
