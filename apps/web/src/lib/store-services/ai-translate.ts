"use server";

/**
 * Plan v3 M3.1 / Phase D-AI — 시술 이름 AI 번역 (Korean → target lang).
 *
 * EditorPanel의 AI suggest 버튼이 호출. Claude Haiku로 1회 ~$0.0005 비용.
 * 인가: `requireStoreOwnerAuth` (시술 편집 권한 가진 사장만).
 * Rate limit: `store-services-ai:${userId}` (10회/60s — AI 호출 비용 보호).
 *
 * Target lang은 5개: en / ja / zh-CN / zh-TW / vi. Ko는 source라 번역 불필요.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 120;
const RATE_LIMIT = { max: 10, windowSec: 60 } as const;

const TARGET_LANGS = ["en", "ja", "zh-CN", "zh-TW", "vi"] as const;
type TargetLang = (typeof TARGET_LANGS)[number];

const inputSchema = z.object({
  nameKo: z.string().trim().min(1).max(100),
  targetLang: z.enum(TARGET_LANGS),
});

const LANG_LABELS: Record<TargetLang, string> = {
  en: "English (US)",
  ja: "Japanese (日本語)",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  vi: "Vietnamese (Tiếng Việt)",
};

type Result =
  | { ok: true; translation: string }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "internal";
      message: string;
    };

export async function suggestServiceTranslationAction(
  input: unknown,
): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: "unauthorized", message: err.message };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: "forbidden", message: err.message };
    }
    Sentry.captureException(err, {
      tags: { route: "action:store-services-ai", phase: "auth" },
    });
    throw err;
  }

  try {
    await checkRateLimit(`store-services-ai:${session.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        ok: false,
        error: "rate_limited",
        message: "AI 번역 요청이 잠시 제한되었습니다. 잠시 후 다시 시도하세요.",
      };
    }
    throw err;
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const langLabel = LANG_LABELS[parsed.data.targetLang];
    const systemPrompt = `You translate Korean beauty/personal-care service names into other languages for a foreign-customer-facing menu. Output ONLY the translation, no quotes, no explanation, no romanization. Keep it concise (max 6 words) and match the natural register used in salon menus.`;
    const userPrompt = `Korean: ${parsed.data.nameKo}\nTarget: ${langLabel}\nTranslate:`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("invalid AI response shape");
    }
    const translation = block.text.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!translation) {
      throw new Error("empty translation");
    }

    return { ok: true, translation };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-services-ai", phase: "translate" },
    });
    return {
      ok: false,
      error: "internal",
      message: "AI 번역에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }
}
