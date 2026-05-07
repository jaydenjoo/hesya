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
import type { ToneVerification } from "@hesya/database";
import { env } from "@/shared/config/env";
import { buildPrompt, type BuildPromptInput } from "./prompt";

export const MODEL = "claude-sonnet-4-6";
// 한국어 4 tone 각 ~150 tokens × 4 + 여유 + verifications ~50 tokens × 4 = 1500.
// Phase 2-A에서 MAX_TOKENS 증액 불필요 (verifications는 라벨+짧은 reason).
const MAX_TOKENS = 1500;
const TOOL_NAME = "generate_tone_variations";

export type Tones = {
  warm: string;
  formal: string;
  short: string;
  friendly: string;
};

export type Verifications = {
  warm: ToneVerification;
  formal: ToneVerification;
  short: ToneVerification;
  friendly: ToneVerification;
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
  /**
   * Phase 2-A — tone 4개에 대한 self-check (state/label/reason).
   * 옵셔널 — Anthropic 응답에 verifications 누락 시(예: 1B-Tone-2 호환 mock)도
   * tones는 정상 반환. UI는 verifications=undefined면 pill 미표시.
   */
  verifications?: Verifications;
  tokensUsed: { input: number; output: number };
};

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

// Phase 2-A — tone별 verification schema. 모든 tone에 동일 schema 재사용.
const VERIFICATION_SCHEMA = {
  type: "object" as const,
  properties: {
    state: {
      type: "string",
      enum: ["ok", "warn"],
      description:
        "톤 일관성 self-check 결과. 'ok'면 해당 톤 라벨에 부합, 'warn'면 어색하거나 정보 누락.",
    },
    label: {
      type: "string",
      description:
        "한국어 짧은 라벨 (예: '따뜻한 톤 유지', '약간 사무적인 톤', '환영 인사 누락'). 사장 화면에 그대로 표시됨.",
    },
    reason: {
      type: ["string", "null"],
      description:
        "state='warn' 시 1~2문장 이유 (한국어, 사장 친화적). state='ok'면 null.",
    },
  },
  required: ["state", "label", "reason"],
};

const TONE_TOOL = {
  name: TOOL_NAME,
  description:
    "고객 메시지에 대한 사장 답변을 4가지 톤으로 동시 생성 + 각 톤 self-check. 모든 톤은 한국어 + 동일한 정보를 담되 어조만 달라야 함.",
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
      verifications: {
        type: "object",
        description:
          "각 톤이 라벨에 부합하는지 self-check. 4개 모두 필수. UI에서 pill로 표시되며 'warn'은 '이유 보기' 버튼이 활성화됨.",
        properties: {
          warm: VERIFICATION_SCHEMA,
          formal: VERIFICATION_SCHEMA,
          short: VERIFICATION_SCHEMA,
          friendly: VERIFICATION_SCHEMA,
        },
        required: ["warm", "formal", "short", "friendly"],
      },
    },
    // verifications는 required X — Anthropic이 누락해도 tones는 살리도록 (점진적 도입).
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

function isValidToneVerification(input: unknown): input is ToneVerification {
  if (!input || typeof input !== "object") return false;
  const o = input as Record<string, unknown>;
  return (
    (o.state === "ok" || o.state === "warn") &&
    typeof o.label === "string" &&
    (o.reason === null || typeof o.reason === "string")
  );
}

function isValidVerifications(input: unknown): input is Verifications {
  if (!input || typeof input !== "object") return false;
  const o = input as Record<string, unknown>;
  return (
    isValidToneVerification(o.warm) &&
    isValidToneVerification(o.formal) &&
    isValidToneVerification(o.short) &&
    isValidToneVerification(o.friendly)
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

  // Phase 2-A — verifications는 옵셔널. 응답에 있으면 검증, 없으면 undefined.
  // 잘못된 형태(state가 enum 외, 필드 누락 등)면 명시 에러로 throw —
  // tones가 아직 살아있어도 fail-fast가 LLM02 검증 일관성 측면에서 우선.
  const inputObj = toolBlock.input as Record<string, unknown>;
  let verifications: Verifications | undefined;
  if (inputObj.verifications !== undefined) {
    if (!isValidVerifications(inputObj.verifications)) {
      throw new Error(
        "Anthropic tool_use input의 verifications 형식 오류 (state must be 'ok'|'warn', label string, reason string|null)",
      );
    }
    verifications = inputObj.verifications;
  }

  return {
    reply: toolBlock.input.warm,
    tones: toolBlock.input,
    verifications,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
