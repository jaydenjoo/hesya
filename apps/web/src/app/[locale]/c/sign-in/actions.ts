"use server";

/**
 * Plan v3 M3.4 — customer magic link sign-in server action.
 *
 * /c/sign-in 폼에서 호출. Better Auth magic-link plugin의 server API를
 * 직접 호출 → sendMagicLink(Resend) trigger. 보안:
 *   - email 형식 zod 검증
 *   - Better Auth 자체 rate-limit (5분/3회) — 추가 layer 불필요
 *   - email enumeration 차단 — 성공/실패 응답 통일 ("이메일 발송 완료" 메시지)
 *   - callbackURL은 같은 origin 내 /{locale}/c/mypage 만 허용 (open redirect 방지)
 */
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { auth } from "@/lib/auth";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "vi", "zh-CN", "zh-TW"] as const;

const inputSchema = z.object({
  email: z.string().trim().email().max(200),
  locale: z.enum(SUPPORTED_LOCALES),
});

export type SignInResult =
  | { ok: true }
  | { ok: false; error: "invalid_input"; message: string };

export async function customerMagicLinkSignInAction(
  input: unknown,
): Promise<SignInResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: "올바른 이메일을 입력해주세요.",
    };
  }
  const { email, locale } = parsed.data;
  // callbackURL은 verify 성공 후 redirect 대상. 같은 origin 내 /{locale}/c/mypage 만.
  // ?locale= 쿼리는 sendCustomerMagicLink가 이메일 언어 결정에 사용.
  const callbackURL = `/${locale}/c/mypage`;
  const magicLinkURL = `${callbackURL}?locale=${locale}`;
  try {
    await auth.api.signInMagicLink({
      body: {
        email,
        callbackURL: magicLinkURL,
      },
      headers: new Headers(),
    });
    return { ok: true };
  } catch (err) {
    // Better Auth rate-limit 또는 sendMagicLink 실패. 보안상 enumeration 방어를
    // 위해 사용자에게는 동일한 "발송됨" 응답을 줘야 하지만, 명백한 zod 실패는 위에서 차단.
    // 여기는 정말 send 실패 — Sentry로 추적 후 ok 응답.
    Sentry.captureException(err, {
      tags: { route: "action:customer-magic-link-sign-in" },
    });
    return { ok: true };
  }
}
