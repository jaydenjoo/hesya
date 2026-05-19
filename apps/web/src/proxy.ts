import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Hesya middleware (Next.js 16 — `proxy.ts`가 middleware 자리).
 *
 * 1. 인증 가드: `/{locale}/admin/*` + `/{locale}/store/*` 경로에서 Better Auth
 *    session cookie 없으면 `/{locale}/sign-in`으로 redirect. layout/page에서
 *    `redirect()` 호출 시 client-side RSC navigation이 정상 변환 안 되어
 *    "Application error: a client-side exception" 발생. middleware는 RSC/일반
 *    요청 모두 동일 HTTP redirect로 처리되어 안전.
 *    layout의 `requireAdminRole` / `requireStoreOwnerAuth`는 role/ownership
 *    검증용으로 유지 (defense-in-depth).
 *    `/store/account/deletion` 등 일부 sub-path 예외는 따로 처리하지 않음 —
 *    모든 owner 페이지는 로그인 필요.
 * 2. Mock 데이터 단계 (`MOCK_FIXTURES=true`): `/admin/*`는 외부 시연용으로 인증
 *    우회. footer "Internal · Operations →" 클릭 시 로그인 없이 진입. 베타 매장
 *    모집 후 Vercel env `MOCK_FIXTURES=false`로 토글하면 정식 가드 복원.
 *    `requireAdminRole`에도 동일 bypass가 있어 page-level guard도 통과.
 * 3. next-intl: 그 외 모든 요청은 i18n routing 미들웨어로 위임.
 */
const AUTH_REQUIRED_PATH =
  /^\/(en|ko|ja|zh-CN|zh-TW|vi)\/(admin|store|onboarding)(?:\/|$)/;
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

// middleware는 별도 runtime — zod 파싱한 `env` 객체 대신 process.env 직접 참조.
// env.ts와 동일한 mockFlag 시맨틱: "true"/"1"만 truthy.
const MOCK_FIXTURES_ENABLED =
  process.env.MOCK_FIXTURES === "true" || process.env.MOCK_FIXTURES === "1";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authMatch = pathname.match(AUTH_REQUIRED_PATH);
  if (authMatch) {
    const section = authMatch[2];
    // Mock 단계에선 admin만 우회 (store/onboarding은 owner 로그인 필요).
    const skipForMock = MOCK_FIXTURES_ENABLED && section === "admin";
    if (!skipForMock) {
      const hasSession = SESSION_COOKIE_NAMES.some((name) =>
        request.cookies.get(name),
      );
      if (!hasSession) {
        const locale = authMatch[1];
        return NextResponse.redirect(
          new URL(`/${locale}/sign-in`, request.url),
        );
      }
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
