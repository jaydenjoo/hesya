/**
 * Phase B-1 + Epic 1B-Tone-2 — Anthropic Sonnet 4.6 호출로 한국어 답변 4 tone 생성.
 *
 * **Tool use 패턴**: `messages.create({ tools, tool_choice: { type:'tool' } })`로
 * 단일 호출에 4 tone variations(warm/formal/short/friendly)을 강제 JSON 출력.
 * 비용 +30~50% (output 토큰만 4배, input은 단일 호출 그대로).
 *
 * **backward compat**: `reply` 필드는 default tone(warm) 유지 — caller
 * (generate-and-store-reply.ts)가 1B-Tone-3 이전까지 기존 흐름 사용 가능.
 *
 * env import 패턴: top-level. anthropic-category-repo.ts는 L-035 추정으로
 * lazy require를 쓰지만, vitest.setup.ts가 모든 env stub을 선제 공급하므로
 * 본 모듈은 top-level이 안전.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/shared/config/env";
import { buildPrompt, type BuildPromptInput } from "./prompt";

const MODEL = "claude-sonnet-4-6";
// 한국어 4 tone 각 ~150 tokens × 4 + 여유 = 1500.
const MAX_TOKENS = 1500;
const TOOL_NAME = "generate_tone_variations";

export type Tones = {
  warm: string;
  formal: string;
  short: string;
  friendly: string;
};

export type GenerateReplyInput = BuildPromptInput;

export type GenerateReplyOutput = {
  /** Backward compat: warm tone 그대로 (caller가 시그니처 변경 없이 사용 가능). */
  reply: string;
  /**
   * 4 tone variations. 1B-Tone-3 진입 전까지 caller는 미사용 가능 → 옵셔널.
   * Production은 항상 실제 4 tone 채워짐 (generate-reply가 tool_use 강제).
   * 단위 테스트 mock은 옵셔널이라 기존 시그니처 호환.
   */
  tones?: Tones;
  tokensUsed: { input: number; output: number };
};

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

const TONE_TOOL = {
  name: TOOL_NAME,
  description:
    "고객 메시지에 대한 사장 답변을 4가지 톤으로 동시 생성. 모든 톤은 한국어 + 동일한 정보를 담되 어조만 달라야 함.",
  input_schema: {
    type: "object" as const,
    properties: {
      warm: {
        type: "string",
        description:
          "따뜻하게 — 친근한 인사 + '~해드릴게요' 어미. 고객을 사장님이 사장님께 말하듯.",
      },
      formal: {
        type: "string",
        description: "공식적으로 — '~합니다' 어미, 군더더기 없음. 비즈니스 톤.",
      },
      short: {
        type: "string",
        description: "짧게 — 1~2문장, 핵심만 전달. 환영 인사 생략 가능.",
      },
      friendly: {
        type: "string",
        description:
          "매장 톤으로 — 캐주얼, 이모지 1개 허용, '~예요/봬요' 친밀 어미.",
      },
    },
    required: ["warm", "formal", "short", "friendly"],
  },
};

function isValidTones(input: unknown): input is Tones {
  if (!input || typeof input !== "object") return false;
  const o = input as Record<string, unknown>;
  return (
    typeof o.warm === "string" &&
    typeof o.formal === "string" &&
    typeof o.short === "string" &&
    typeof o.friendly === "string"
  );
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
      tools: [TONE_TOOL],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });
  } catch (cause) {
    // SDK 에러 원문(키 prefix·헤더 정보 포함 가능) 외부 전파 X. cause만 보존.
    throw new Error("AI 응답 생성 실패", { cause });
  }

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Anthropic 응답에 tool_use block 없음");
  }
  if (!isValidTones(toolBlock.input)) {
    throw new Error(
      "Anthropic tool_use input에 tone 필드 누락 (warm/formal/short/friendly 모두 필수)",
    );
  }

  return {
    reply: toolBlock.input.warm,
    tones: toolBlock.input,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
