"use server";

/**
 * Plan v3 M3.1 / Phase D-AI — 시술 이름 AI 번역 (Korean → target lang).
 *
 * 2개 server action:
 * - `suggestServiceTranslationAction`: 단일 lang (탭별 + 버튼)
 * - `suggestAllServiceTranslationsAction`: 5 lang batch (1회 호출로 모두)
 *
 * Model: Claude Haiku 4.5. Cost: 단일 ~$0.0005, batch ~$0.002 (output 5x).
 * 인가: `requireStoreOwnerAuth`.
 * Rate limit: `store-services-ai:${userId}` (10회/60s — batch는 1 token으로 카운트).
 *
 * In-memory cache (server module-level Map, LRU 100 entries):
 * 같은 (nameKo, targetLang) 조합 반복 호출 시 Claude 호출 생략. process 재시작
 * 시 초기화 (intentional — prod에선 Redis 캐시로 교체 권장).
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
const RATE_LIMIT = { max: 10, windowSec: 60 } as const;
const CACHE_MAX_SIZE = 100;

const TARGET_LANGS = ["en", "ja", "zh-CN", "zh-TW", "vi"] as const;
type TargetLang = (typeof TARGET_LANGS)[number];

const singleInputSchema = z.object({
  nameKo: z.string().trim().min(1).max(100),
  targetLang: z.enum(TARGET_LANGS),
});

const batchInputSchema = z.object({
  nameKo: z.string().trim().min(1).max(100),
});

const LANG_LABELS: Record<TargetLang, string> = {
  en: "English (US)",
  ja: "Japanese (日本語)",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  vi: "Vietnamese (Tiếng Việt)",
};

type SingleResult =
  | { ok: true; translation: string }
  | { ok: false; error: ActionError; message: string };

type BatchResult =
  | {
      ok: true;
      translations: Record<TargetLang, string>;
    }
  | { ok: false; error: ActionError; message: string };

type ActionError =
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "invalid_input"
  | "internal";

// In-memory LRU cache (server-side module-level). Map은 insertion order를
// 보존하므로 oldest entry는 첫 key. 100 entry 초과 시 first key 제거.
const translationCache = new Map<string, string>();

function cacheKey(nameKo: string, targetLang: TargetLang): string {
  return `${targetLang}::${nameKo.trim()}`;
}

function cacheGet(nameKo: string, targetLang: TargetLang): string | undefined {
  const key = cacheKey(nameKo, targetLang);
  const v = translationCache.get(key);
  if (v !== undefined) {
    // LRU: 최근 hit한 entry를 끝으로 이동
    translationCache.delete(key);
    translationCache.set(key, v);
  }
  return v;
}

function cacheSet(
  nameKo: string,
  targetLang: TargetLang,
  translation: string,
): void {
  const key = cacheKey(nameKo, targetLang);
  translationCache.set(key, translation);
  if (translationCache.size > CACHE_MAX_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey !== undefined) translationCache.delete(firstKey);
  }
}

async function authorize(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: ActionError; message: string }
> {
  try {
    const session = await requireStoreOwnerAuth();
    return { ok: true, userId: session.userId };
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
}

async function rateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: ActionError; message: string }> {
  try {
    await checkRateLimit(`store-services-ai:${userId}`, RATE_LIMIT);
    return { ok: true };
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
}

function sanitizeTranslation(text: string): string {
  return text.trim().replace(/^["'`]+|["'`]+$/g, "");
}

export async function suggestServiceTranslationAction(
  input: unknown,
): Promise<SingleResult> {
  const parsed = singleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  const cached = cacheGet(parsed.data.nameKo, parsed.data.targetLang);
  if (cached) return { ok: true, translation: cached };

  const auth = await authorize();
  if (!auth.ok) return auth;
  const rl = await rateLimit(auth.userId);
  if (!rl.ok) return rl;

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const langLabel = LANG_LABELS[parsed.data.targetLang];
    const systemPrompt = `You translate Korean beauty/personal-care service names into other languages for a foreign-customer-facing menu. Output ONLY the translation, no quotes, no explanation, no romanization. Keep it concise (max 6 words) and match the natural register used in salon menus.`;
    const userPrompt = `Korean: ${parsed.data.nameKo}\nTarget: ${langLabel}\nTranslate:`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 120,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("invalid AI response shape");
    }
    const translation = sanitizeTranslation(block.text);
    if (!translation) throw new Error("empty translation");

    cacheSet(parsed.data.nameKo, parsed.data.targetLang, translation);
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

export async function suggestAllServiceTranslationsAction(
  input: unknown,
): Promise<BatchResult> {
  const parsed = batchInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  // Cache hit check — 모든 lang이 캐시에 있으면 API 호출 생략.
  const fromCache: Partial<Record<TargetLang, string>> = {};
  const missing: TargetLang[] = [];
  for (const lang of TARGET_LANGS) {
    const hit = cacheGet(parsed.data.nameKo, lang);
    if (hit) fromCache[lang] = hit;
    else missing.push(lang);
  }
  if (missing.length === 0) {
    return {
      ok: true,
      translations: fromCache as Record<TargetLang, string>,
    };
  }

  const auth = await authorize();
  if (!auth.ok) return auth;
  const rl = await rateLimit(auth.userId);
  if (!rl.ok) return rl;

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const missingLabels = missing.map((l) => `- ${l}: ${LANG_LABELS[l]}`);
    const systemPrompt = `You translate Korean beauty/personal-care service names into multiple languages for a foreign-customer-facing menu. Output ONLY a JSON object with the requested language codes as keys and the translations as string values. No prose, no markdown fences, no explanation. Each translation should be concise (max 6 words) and match the natural register used in salon menus.`;
    const userPrompt = `Korean: ${parsed.data.nameKo}\n\nTranslate into these languages:\n${missingLabels.join("\n")}\n\nReturn JSON like {"en":"...","ja":"...","zh-CN":"...","zh-TW":"...","vi":"..."} (only the langs above).`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("invalid AI response shape");
    }
    // 응답이 ``` fence를 포함할 수 있어 첫 { ~ 마지막 } 추출 (방어적).
    const text = block.text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("AI response did not contain JSON");
    }
    const jsonStr = text.slice(start, end + 1);
    const raw = JSON.parse(jsonStr) as unknown;
    if (typeof raw !== "object" || raw === null) {
      throw new Error("AI JSON not an object");
    }
    const obj = raw as Record<string, unknown>;
    const result: Record<TargetLang, string> = {
      en: fromCache.en ?? "",
      ja: fromCache.ja ?? "",
      "zh-CN": fromCache["zh-CN"] ?? "",
      "zh-TW": fromCache["zh-TW"] ?? "",
      vi: fromCache.vi ?? "",
    };
    for (const lang of missing) {
      const v = obj[lang];
      if (typeof v === "string") {
        const cleaned = sanitizeTranslation(v);
        if (cleaned) {
          result[lang] = cleaned;
          cacheSet(parsed.data.nameKo, lang, cleaned);
        }
      }
    }
    return { ok: true, translations: result };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-services-ai", phase: "translate-batch" },
    });
    return {
      ok: false,
      error: "internal",
      message: "AI 번역에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }
}
