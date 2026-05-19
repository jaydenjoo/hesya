import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Hesya middleware (Next.js 16 — `proxy.ts`가 middleware 자리).
 *
 * 1. Admin 가드: `/{locale}/admin/*` 경로에서 Better Auth session cookie 없으면
 *    `/{locale}/sign-in`으로 redirect. layout/page에서 `redirect()` 호출 시
 *    client-side RSC navigation이 정상 변환 안 되어 "Application error" 발생.
 *    middleware는 RSC/일반 요청 모두 동일 HTTP redirect로 처리되어 안전.
 *    (layout의 `requireAdminRole` 가드는 admin role 검증용으로 유지 — defense-in-depth).
 * 2. next-intl: 그 외 모든 요청은 i18n routing 미들웨어로 위임.
 */
const ADMIN_PATH = /^\/(en|ko|ja|zh-CN|zh-TW|vi)\/admin(?:\/|$)/;
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminMatch = pathname.match(ADMIN_PATH);
  if (adminMatch) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) =>
      request.cookies.get(name),
    );
    if (!hasSession) {
      const locale = adminMatch[1];
      return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
