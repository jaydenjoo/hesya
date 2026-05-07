/**
 * Vitest 글로벌 setup.
 *
 * - env stubs: env.ts(zod 검증)이 import만 해도 throw하지 않도록 미리 충족.
 *   테스트 환경에서는 실제 외부 서비스 호출 X — 통합 테스트는 자체 변수
 *   (예: HESYA_TEST_DATABASE_URL) 또는 명시적 mock 사용.
 * - jest-dom matchers extend (toBeInTheDocument 등)
 * - 각 테스트 후 RTL DOM cleanup (메모리 누수 방지)
 */
const stubs: Record<string, string> = {
  NODE_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:4200",
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "stub-anon-key-aaaaaaaaaaaaaaaaaa",
  SUPABASE_SERVICE_ROLE_KEY: "stub-service-key-aaaaaaaaaaaaaaaaaa",
  // 통합 테스트 (HESYA_TEST_DATABASE_URL 셋업 시): webhook route 등이 직접
  // createDbClient(env.DATABASE_URL) 호출하는 곳도 같은 로컬 supabase에 연결되도록
  // DATABASE_URL을 동기화. 미설정이면 stub URL (단위 테스트는 connect X).
  // env.ts는 module-level zod parse라 import 직전에 process.env 채워야 함.
  DATABASE_URL:
    process.env.HESYA_TEST_DATABASE_URL ??
    "postgres://stub:stub@localhost:5432/stub",
  BETTER_AUTH_SECRET: "stub-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  BETTER_AUTH_URL: "http://localhost:4200",
  GOOGLE_CLIENT_ID: "stub-google-client-id",
  GOOGLE_CLIENT_SECRET: "stub-google-client-secret",
  SENTRY_DSN: "https://stub@example.com/1",
  NEXT_PUBLIC_SENTRY_DSN: "https://stub@example.com/1",
  NEXT_PUBLIC_POSTHOG_KEY: "phc_stub",
  NEXT_PUBLIC_POSTHOG_HOST: "https://us.posthog.com",
  KOREA_NTS_API_KEY: "stub-nts-key-aaaaaaaaaaaaaaaaaa",
  KOREA_LOCALDATA_API_KEY: "stub-localdata-key-aaaaaaaaaaaaaaaaaa",
  ADMIN_EMAILS: "test@example.com",
  CRON_SECRET: "stub-cron-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  RESEND_API_KEY: "re_stub",
  RESEND_FROM_EMAIL: "test@example.com",
  ANTHROPIC_API_KEY: "sk-ant-stub",
  OPENAI_API_KEY: "sk-stub",
  IG_APP_ID: "stub-ig-app-id",
  IG_APP_SECRET: "stub-ig-app-secret",
  IG_WEBHOOK_VERIFY_TOKEN: "stub-ig-verify-token",
  IG_REDIRECT_URI: "https://stub.example.com/api/oauth/instagram/callback",
  QSTASH_TOKEN: "stub-qstash-token-aaaaaaaaaaaaaaaaaa",
  QSTASH_CURRENT_SIGNING_KEY: "stub-qstash-current-aaaaaaaaaaaaaaaaaa",
  QSTASH_NEXT_SIGNING_KEY: "stub-qstash-next-aaaaaaaaaaaaaaaaaa",
};
for (const [k, v] of Object.entries(stubs)) {
  if (process.env[k] == null || process.env[k] === "") {
    process.env[k] = v;
  }
}
// 통합 테스트 모드: CI e2e-integration job env에 이미 dummy DATABASE_URL이
// set되어 있어 위 stub fallback (`if (env[k]==null)`)이 skip됨.
// HESYA_TEST_DATABASE_URL이 있으면 무조건 DATABASE_URL을 supabase URL로 override
// (webhook route 등 module-level createDbClient(env.DATABASE_URL) 호출이 같은
// 로컬 supabase에 연결되도록).
if (process.env.HESYA_TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.HESYA_TEST_DATABASE_URL;
}

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
