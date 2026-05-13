/**
 * Auth cookie cache TTFB benchmark.
 *
 * PR #150 효과 객관화 — Better Auth `session.cookieCache` 5분 TTL 활성화로
 * `auth.api.getSession()`이 매 nav마다 DB SELECT → cookie 직접 read로 대체된
 * 효과를 정량 측정.
 *
 * 측정 방법:
 *   1. 데모 계정으로 password login (POST /api/auth/sign-in/email)
 *   2. 5개 인증 owner 페이지 × 6회씩 nav (iter 0 = cold, iter 1~5 = warm avg)
 *   3. waitUntil: "commit"으로 TTFB 근사 측정 (첫 HTML byte 도착)
 *   4. cold (DB hit) vs warm (cookie cache hit) 평균 비교
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

const ITER_PER_PAGE = 6; // 1 cold + 5 warm

interface Sample {
  readonly path: string;
  readonly iter: number;
  readonly ttfbMs: number;
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
    test.setTimeout(180_000); // 30 nav × 평균 1~3s = 90s 여유

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

    // 4) 페이지별 cold vs warm avg 출력
    console.log("\n=== Auth Cookie Cache TTFB Benchmark Result ===");
    console.log(`baseURL: ${baseUrl}`);
    console.log(`account: ${TEST_EMAIL} (5 pages × ${ITER_PER_PAGE} iter)`);
    console.log("");
    console.log(
      "| Path                     | Cold (iter 0) | Warm avg (iter 1~5) | Δ (ms) | Δ (%) |",
    );
    console.log(
      "|--------------------------|---------------|---------------------|--------|-------|",
    );
    for (const path of TARGET_PATHS) {
      const pathSamples = samples.filter((s) => s.path === path);
      const cold = pathSamples.find((s) => s.iter === 0)!.ttfbMs;
      const warmSamples = pathSamples.filter((s) => s.iter > 0);
      const warmAvg = Math.round(
        warmSamples.reduce((sum, s) => sum + s.ttfbMs, 0) / warmSamples.length,
      );
      const delta = cold - warmAvg;
      const deltaPct = cold > 0 ? Math.round((delta / cold) * 100) : 0;
      console.log(
        `| ${path.padEnd(24)} | ${String(cold).padStart(10)}ms | ${String(warmAvg).padStart(16)}ms | ${String(delta).padStart(6)} | ${String(deltaPct).padStart(4)}% |`,
      );
    }
    console.log("");
    console.log(
      "해석: warm avg < cold이면 cookie cache hit (PR #150 효과). 같으면 cache miss 또는 cache 미적용.",
    );

    // 5) 측정 sanity: 적어도 1개 페이지에서 warm < cold (cookie cache 작동 증명)
    const pageStats = TARGET_PATHS.map((path) => {
      const ps = samples.filter((s) => s.path === path);
      const cold = ps.find((s) => s.iter === 0)!.ttfbMs;
      const warmAvg =
        ps.filter((s) => s.iter > 0).reduce((sum, s) => sum + s.ttfbMs, 0) /
        (ITER_PER_PAGE - 1);
      return { path, cold, warmAvg };
    });
    const anyWarmFaster = pageStats.some((s) => s.warmAvg < s.cold);
    expect(
      anyWarmFaster,
      "최소 1개 페이지는 warm < cold여야 cookie cache가 작동 중",
    ).toBe(true);
  });
});
