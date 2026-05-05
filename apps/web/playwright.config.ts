import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Hesya web E2E.
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL (Supabase local 또는 별도 schema)
 *   - E2E_AUTH_USER_ID: store-owner-guard E2E bypass용 (NODE_ENV !== "production"에서만 작동)
 *   - IG_API_BASE_URL: external IG API mock URL (예: http://localhost:4201)
 *
 * 실행:
 *   pnpm --filter @hesya/web e2e
 *   pnpm --filter @hesya/web e2e:ui
 *
 * CI: 별도 job (PR B에서 추가). 현재는 로컬 실행만 보장.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // DB 격리 → 직렬 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4200",
    trace: "on-first-retry",
    // 1A는 ko 단일 시나리오. 다국어(en/ja/zh-CN/zh-TW/vi) 시나리오는
    // project별 use.locale override로 분리 추가.
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
