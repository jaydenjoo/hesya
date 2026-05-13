/**
 * Auth cookie cache TTFB benchmark.
 *
 * PR #150 효과 객관화 — Better Auth `session.cookieCache` 5분 TTL 활성화로
 * `auth.api.getSession()`이 매 nav마다 DB SELECT → cookie 직접 read로 대체된
 * 효과를 정량 측정.
 *
 * 측정 방법:
 *   1. 데모 계정으로 password login (POST /api/auth/sign-in/email)
 *   2. 5개 인증 owner 페이지 × 11회씩 nav (iter 0 = cold, iter 1~10 = warm)
 *   3. waitUntil: "commit"으로 TTFB 근사 측정 (첫 HTML byte 도착)
 *   4. cold (DB hit) vs warm 통계 (median + p95) 비교
 *
 * N≥10 통계화: avg는 outlier에 약함 → median + p95로 cold start 노이즈 격리.
 *
 * 환경변수:
 *   - PLAYWRIGHT_BASE_URL: prod 측정 권장 (예: https://hesya-web.vercel.app)
 *   - PERF_TEST_EMAIL / PERF_TEST_PASSWORD: 로그인 자격증명 (없으면 skip)
 *
 * 실행:
 *   PLAYWRIGHT_BASE_URL=https://hesya-web.vercel.app \
 *   PERF_TEST_EMAIL=demo@hesya.com \
 *   PERF_TEST_PASSWORD=Hesya!Demo2026 \
 *   pnpm --filter @hesya/web exec playwright test e2e/perf-auth-cookie-cache.spec.ts --reporter=list
 *
 * 결과는 콘솔 출력 — 결과 표는 수동으로 docs/auth-cookie-cache-bench.md 갱신.
 */
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";

const TEST_EMAIL = process.env.PERF_TEST_EMAIL;
const TEST_PASSWORD = process.env.PERF_TEST_PASSWORD;

const TARGET_PATHS = [
  "/ko/store/dashboard",
  "/ko/store/bookings",
  "/ko/store/inbox",
  "/ko/store/customers",
  "/ko/store/services",
] as const;

const ITER_PER_PAGE = 11; // 1 cold + 10 warm (N≥10 for median + p95)

interface Sample {
  readonly path: string;
  readonly iter: number;
  readonly ttfbMs: number;
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = p * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo));
}

async function loginViaApi(
  request: APIRequestContext,
  baseUrl: string,
  email: string,
  password: string,
): Promise<{ readonly cookieHeader: string }> {
  const url = `${baseUrl}/api/auth/sign-in/email`;
  const res = await request.post(url, {
    data: { email, password },
    headers: { "content-type": "application/json" },
  });
  expect(res.ok(), `login failed: ${res.status()} ${await res.text()}`).toBe(
    true,
  );
  const setCookies = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie");
  const cookieHeader = setCookies
    .map((h) => h.value.split(";")[0])
    .filter(Boolean)
    .join("; ");
  expect(cookieHeader, "no Set-Cookie returned from sign-in").not.toBe("");
  return { cookieHeader };
}

async function measureTtfb(page: Page, url: string): Promise<number> {
  const t0 = Date.now();
  // waitUntil: "commit" → 첫 HTML byte 도착 시 resolve. TTFB 근사치.
  await page.goto(url, { waitUntil: "commit" });
  const t1 = Date.now();
  return t1 - t0;
}

test.describe("Auth cookie cache TTFB benchmark", () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    "PERF_TEST_EMAIL + PERF_TEST_PASSWORD env 필요",
  );

  test("5 owner pages × 6 iter — cold vs warm TTFB", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(360_000); // 55 nav × 평균 3s = 165s 여유 (N=11 × 5 pages)

    expect(baseURL, "baseURL 미설정").toBeTruthy();
    const baseUrl = baseURL!;

    // 1) API login → cookie 추출
    const { cookieHeader } = await loginViaApi(
      request,
      baseUrl,
      TEST_EMAIL!,
      TEST_PASSWORD!,
    );

    // 2) 브라우저 컨텍스트에 cookie 주입
    const cookieKvs = cookieHeader.split("; ").map((kv) => {
      const [name, ...rest] = kv.split("=");
      return { name, value: rest.join("=") };
    });
    const u = new URL(baseUrl);
    await page.context().addCookies(
      cookieKvs.map((c) => ({
        name: c.name,
        value: c.value,
        domain: u.hostname,
        path: "/",
        httpOnly: true,
        secure: u.protocol === "https:",
        sameSite: "Lax",
      })),
    );

    // 3) 첫 nav (warm-up — cookie cache miss를 separate iter 0으로 기록)
    const samples: Sample[] = [];
    for (const path of TARGET_PATHS) {
      for (let iter = 0; iter < ITER_PER_PAGE; iter++) {
        const ttfbMs = await measureTtfb(page, `${baseUrl}${path}`);
        samples.push({ path, iter, ttfbMs });
        console.log(`[bench] ${path} iter=${iter} ttfb=${ttfbMs}ms`);
      }
    }

    // 4) 페이지별 cold + warm 통계 (median + p95) 출력
    const warmIterCount = ITER_PER_PAGE - 1;
    console.log("\n=== Auth Cookie Cache TTFB Benchmark Result ===");
    console.log(`baseURL: ${baseUrl}`);
    console.log(
      `account: ${TEST_EMAIL} (5 pages × ${ITER_PER_PAGE} iter = 1 cold + ${warmIterCount} warm)`,
    );
    console.log("");
    console.log(
      "| Path                     | Cold  | Warm median | Warm p95 | Δ median | Δ % |",
    );
    console.log(
      "|--------------------------|-------|-------------|----------|----------|-----|",
    );
    const pageStats = TARGET_PATHS.map((path) => {
      const pathSamples = samples.filter((s) => s.path === path);
      const cold = pathSamples.find((s) => s.iter === 0)!.ttfbMs;
      const warmSorted = pathSamples
        .filter((s) => s.iter > 0)
        .map((s) => s.ttfbMs)
        .sort((a, b) => a - b);
      const warmMedian = percentile(warmSorted, 0.5);
      const warmP95 = percentile(warmSorted, 0.95);
      const delta = cold - warmMedian;
      const deltaPct = cold > 0 ? Math.round((delta / cold) * 100) : 0;
      console.log(
        `| ${path.padEnd(24)} | ${String(cold).padStart(4)}ms | ${String(warmMedian).padStart(8)}ms | ${String(warmP95).padStart(5)}ms | ${String(delta).padStart(5)} | ${String(deltaPct).padStart(3)}% |`,
      );
      return { path, cold, warmMedian, warmP95 };
    });
    console.log("");
    console.log(
      "해석: warm median < cold이면 cookie cache hit (PR #150 효과). p95는 outlier 영향 확인용.",
    );

    // 5) 측정 sanity: 적어도 1개 페이지에서 warm median < cold (cookie cache 작동 증명)
    const anyWarmFaster = pageStats.some((s) => s.warmMedian < s.cold);
    expect(
      anyWarmFaster,
      "최소 1개 페이지는 warm median < cold여야 cookie cache가 작동 중",
    ).toBe(true);
  });
});
