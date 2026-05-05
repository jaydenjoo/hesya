/**
 * Phase B-1 — Anthropic Sonnet 4.6 호출로 한국어 답변 초안 생성.
 *
 * 본 모듈은 **순수 호출 레이어** — DB, Server Action, Webhook과 무관.
 * 통합(Server Action 트리거)은 Phase B-2.
 *
 * env import 패턴: top-level. anthropic-category-repo.ts는 L-035 추정으로 lazy require를
 * 쓰지만, vitest.setup.ts가 모든 env stub을 선제 공급하므로 본 모듈은 top-level이 안전.
 * (server-only 가드 + vitest alias stub으로 client bundle 위험도 차단됨.)
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/shared/config/env";
import { buildPrompt, type BuildPromptInput } from "./prompt";

const MODEL = "claude-sonnet-4-6";
// 한국어 초안 2~4문장 기준 ~150 tokens, 여유 포함 600. 자동 번역(B-3)은 별도 호출이라 여기서 더 키울 필요 X.
const MAX_TOKENS = 600;

export type GenerateReplyInput = BuildPromptInput;

export type GenerateReplyOutput = {
  reply: string;
  // SDK 원본 input_tokens/output_tokens를 input/output으로 단축. Phase B-2에서 DB 컬럼명과 매칭.
  tokensUsed: { input: number; output: number };
};

// 모듈 수명 동안 단일 인스턴스 유지 (SDK 자체가 stateless). 테스트는 @anthropic-ai/sdk 전체 mock으로 격리.
let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

export async function generateReply(
  input: GenerateReplyInput,
): Promise<GenerateReplyOutput> {
  const { system, messages } = buildPrompt(input);

  let response;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    });
  } catch (cause) {
    // SDK 에러 원문(키 prefix·헤더 정보 포함 가능)을 외부로 전파 X. cause만 보존.
    throw new Error("AI 응답 생성 실패", { cause });
  }

  // SDK 타입 narrowing 한계로 find predicate 통과 후에도 type guard 재실행 필요.
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic 응답에 text block 없음");
  }

  return {
    reply: textBlock.text,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
