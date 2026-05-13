"use server";

/**
 * 매장 매니저 magic link sign-in server action.
 *
 * /sign-in 폼에서 호출. Better Auth magic-link plugin의 server API를 직접 호출
 * → routeMagicLink (lib/auth.ts) → sendOwnerMagicLink (Resend) trigger.
 *
 * 보안:
 *   - email 형식 zod 검증
 *   - Better Auth 자체 rate-limit (5분/3회)
 *   - email enumeration 차단 — 성공/실패 응답 통일
 *   - callbackURL은 같은 origin 내 /{locale}/store/dashboard 만 (open redirect 방지)
 *   - 추가로 callbackUrl prop (search param)에서 받은 path도 /로 시작 + // 차단 후
 *     dashboard 대신 사용 (sign-in 진입 시 ?callbackUrl=/ko/store/inbox 같은 deep link)
 */
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { auth } from "@/lib/auth";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "vi", "zh-CN", "zh-TW"] as const;

const inputSchema = z.object({
  email: z.string().trim().email().max(200),
  locale: z.enum(SUPPORTED_LOCALES),
  callbackUrl: z.string().optional(),
});

export type OwnerSignInResult =
  | { ok: true }
  | { ok: false; error: "invalid_input"; message: string };

function sanitizeCallback(raw: string | undefined, locale: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return `/${locale}/store/dashboard`;
  }
  return raw;
}

export async function ownerMagicLinkSignInAction(
  input: unknown,
): Promise<OwnerSignInResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: "올바른 이메일을 입력해주세요.",
    };
  }
  const { email, locale, callbackUrl } = parsed.data;
  const callback = sanitizeCallback(callbackUrl, locale);
  try {
    await auth.api.signInMagicLink({
      body: {
        email,
        callbackURL: callback,
      },
      headers: new Headers(),
    });
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:owner-magic-link-sign-in" },
    });
    return { ok: true };
  }
}
