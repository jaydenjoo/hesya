/**
 * Phase B-1 — Anthropic Sonnet 4.6 호출로 한국어 답변 초안 생성.
 *
 * 본 모듈은 **순수 호출 레이어** — DB, Server Action, Webhook과 무관.
 * 통합(Server Action 트리거)은 Phase B-2.
 *
 * env import는 함수 호출 시점에 lazy load (anthropic-category-repo.ts와 동일, L-035).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/shared/config/env";
import { buildPrompt, type BuildPromptInput } from "./prompt";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 600;

export type GenerateReplyInput = BuildPromptInput;

export type GenerateReplyOutput = {
  reply: string;
  tokensUsed: { input: number; output: number };
};

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

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages,
  });

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
