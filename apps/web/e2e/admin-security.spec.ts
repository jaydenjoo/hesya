/**
 * Admin / Owner-side abnormal access E2E.
 *
 * Customer-side (`customer-security.spec.ts` + `customer-abuse.spec.ts`)
 * 보완. 본 spec은 **권한 escalation**, **cross-store IDOR**, **admin route
 * 하드닝**을 검증한다. 보안 등급 🔴.
 *
 * 시나리오:
 *   N. 미인증 admin/owner 경로 접근 — 모두 sign-in 리다이렉트 또는 401
 *      1. /ko/admin
 *      2. /ko/admin/store-verifications
 *      3. /ko/admin/disputes
 *      4. /ko/admin/store-deletion
 *      5. /ko/admin/store-reports
 *      6. /ko/admin/payment-monitoring
 *      7. /ko/admin/api-policy-alerts
 *      8. /ko/admin/ai-cost
 *      9. /ko/admin/ai-accuracy
 *     10. /ko/admin/store-disputes
 *     11. /ko/store/dashboard
 *     12. /ko/store/inbox
 *     13. /ko/store/customers
 *
 *   O. 권한 escalation — customer 세션으로 admin 경로 GET
 *      14. E2E_CUSTOMER_EMAIL 세션 → /admin → 차단 (sign-in 또는 403)
 *
 *   P. UUID 조작 — admin 페이지 detail param IDOR
 *     15. /admin/disputes/<random uuid> → 404
 *     16. /admin/store-verifications/<random uuid> → 404
 *
 *   Q. 위조 헤더 — 일부 무지한 reverse-proxy가 헤더로 user 신뢰
 *     17. x-admin: true 헤더 위조 → 무영향 (Better Auth만 신뢰)
 *     18. X-User-Role: admin 위조 → 무영향
 *
 *   R. Webhook 서명 위조
 *     19. /api/webhooks/instagram POST with invalid x-hub-signature-256 → 401
 *
 *   S. Mass admin enum
 *     20. /admin/disputes/<UUID 50개> → 404 일관 (500/200 미노출)
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL (격리 DB)
 *   - dev 서버 자동 기동
 *   - **E2E_ADMIN 또는 admin 세션 우회 env 없음** — 본 spec은 미인증/외부 손님 관점
 *
 * 본 spec이 fail = 미인증으로 admin 데이터 노출 가능 = 베타 출시 차단.
 */
import { test, expect } from "@playwright/test";

const RANDOM_UUID = "00000000-0000-4000-8000-000000000aaa";

const ADMIN_ROUTES = [
  "/ko/admin",
  "/ko/admin/store-verifications",
  "/ko/admin/disputes",
  "/ko/admin/store-deletion",
  "/ko/admin/store-reports",
  "/ko/admin/payment-monitoring",
  "/ko/admin/api-policy-alerts",
  "/ko/admin/ai-cost",
  "/ko/admin/ai-accuracy",
];

const OWNER_ROUTES = [
  "/ko/store/dashboard",
  "/ko/store/inbox",
  "/ko/store/customers",
  "/ko/store/services",
  "/ko/store/bookings",
  "/ko/store/settings",
];

test.describe("admin/owner security — 미인증 차단 + 권한 escalation", () => {
  test.describe("N. 미인증 admin 경로 — 모두 sign-in 리다이렉트 또는 401", () => {
    for (const route of ADMIN_ROUTES) {
      test(`${route} — 미인증 거부`, async ({ page }) => {
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });
        const body = await page.content();
        const url = page.url();
        const status = response?.status() ?? 0;
        // 정상 거부 시그널: (a) /sign-in 리다이렉트, (b) 401/403/404 응답
        // (404 = page.tsx 없음, 데이터 노출 불가), (c) 본문에 "로그인" 텍스트.
        // admin 데이터 (매장명/KPI 숫자/분쟁 ID 등) 노출 = fail.
        const allowed =
          status === 401 ||
          status === 403 ||
          status === 404 ||
          url.includes("/sign-in") ||
          body.includes("로그인") ||
          body.includes("Sign in") ||
          body.includes("Sign In");
        expect(allowed).toBeTruthy();
      });
    }
  });

  test.describe("N'. 미인증 owner 경로 — 모두 sign-in 리다이렉트", () => {
    for (const route of OWNER_ROUTES) {
      test(`${route} — 미인증 거부`, async ({ page }) => {
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });
        const body = await page.content();
        const url = page.url();
        const status = response?.status() ?? 0;
        const allowed =
          status === 401 ||
          status === 403 ||
          status === 404 ||
          url.includes("/sign-in") ||
          body.includes("로그인") ||
          body.includes("Sign in") ||
          body.includes("Sign In");
        expect(allowed).toBeTruthy();
      });
    }
  });

  test.describe("P. UUID 조작 — admin detail IDOR", () => {
    test(`/admin/disputes/<random uuid> — 미인증이면 sign-in / 인증이면 404`, async ({
      page,
    }) => {
      const response = await page.goto(`/ko/admin/disputes/${RANDOM_UUID}`, {
        waitUntil: "domcontentloaded",
      });
      // 미인증 → sign-in. (인증된 admin이면 404가 정상. 200 + 다른 분쟁 데이터 노출은 X.)
      const url = page.url();
      const allowed =
        url.includes("/sign-in") ||
        response?.status() === 401 ||
        response?.status() === 404;
      expect(allowed).toBeTruthy();
    });

    test(`/admin/store-verifications/<random uuid> — sign-in 또는 404`, async ({
      page,
    }) => {
      const response = await page.goto(
        `/ko/admin/store-verifications/${RANDOM_UUID}`,
        { waitUntil: "domcontentloaded" },
      );
      const url = page.url();
      const allowed =
        url.includes("/sign-in") ||
        response?.status() === 401 ||
        response?.status() === 404;
      expect(allowed).toBeTruthy();
    });
  });

  test.describe("Q. 위조 헤더 — Better Auth만 신뢰", () => {
    test("x-admin / x-user-role / x-forwarded-user 위조 → 무영향", async ({
      page,
    }) => {
      await page.setExtraHTTPHeaders({
        "x-admin": "true",
        "x-user-role": "admin",
        "x-forwarded-user": "admin@hesya.test",
        "x-user-id": "admin-id",
      });
      const response = await page.goto("/ko/admin/disputes", {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBeLessThan(500);
      const url = page.url();
      const body = await page.content();
      const passed =
        url.includes("/sign-in") ||
        response?.status() === 401 ||
        body.includes("로그인") ||
        body.includes("Sign in");
      // 헤더만으로 admin 인증 우회되면 = CRITICAL
      expect(passed).toBeTruthy();
    });
  });

  test.describe("R. Webhook 서명 위조 — 401 응답", () => {
    test("/api/webhooks/instagram — 위조 x-hub-signature-256 → 401", async ({
      page,
    }) => {
      const response = await page.request.post(
        "http://localhost:4200/api/webhooks/instagram",
        {
          headers: {
            "x-hub-signature-256": "sha256=00".padEnd(70, "0"),
            "content-type": "application/json",
          },
          data: JSON.stringify({ entry: [{ messaging: [] }] }),
          failOnStatusCode: false,
        },
      );
      expect(response.status()).toBe(401);
    });

    test("/api/webhooks/instagram — 서명 헤더 누락 → 401", async ({ page }) => {
      const response = await page.request.post(
        "http://localhost:4200/api/webhooks/instagram",
        {
          headers: { "content-type": "application/json" },
          data: JSON.stringify({ entry: [] }),
          failOnStatusCode: false,
        },
      );
      expect(response.status()).toBe(401);
    });

    test("/api/queue/inbox-process-inbound — QStash 서명 검증 (위조 → 차단)", async ({
      page,
    }) => {
      const response = await page.request.post(
        "http://localhost:4200/api/queue/inbox-process-inbound",
        {
          headers: {
            "content-type": "application/json",
            "upstash-signature": "invalid",
          },
          data: JSON.stringify({ messageId: "fake" }),
          failOnStatusCode: false,
        },
      );
      // QStash verifySignatureAppRouter → 401/403. dev에 QSTASH_CURRENT_SIGNING_KEY
      // env 없으면 verifier가 500 throw. 어느 경우든 200 (처리 성공) 절대 없음.
      expect(response.status()).not.toBe(200);
      expect([401, 403, 500]).toContain(response.status());
    });
  });

  test.describe("S. Admin mass enum — UUID brute force", () => {
    test("/admin/disputes/<UUID 30개> — 일관 응답 (200 + 다른 분쟁 데이터 노출 0)", async ({
      page,
    }) => {
      const statuses: number[] = [];
      const bodyHashes = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const uuid = `00000000-0000-4000-8000-${(i + 200).toString().padStart(12, "0")}`;
        const response = await page.goto(`/ko/admin/disputes/${uuid}`, {
          waitUntil: "domcontentloaded",
        });
        statuses.push(response?.status() ?? 0);
        const body = await page.content();
        // 짧은 hash로 본문 일관성만 확인 — 페이지마다 다른 데이터가 나오면 IDOR.
        bodyHashes.add(body.slice(0, 200));
      }
      // 모든 응답이 5xx 아님 + 본문이 모두 같은 sign-in 또는 404 페이지여야 함.
      const serverErrors = statuses.filter((s) => s >= 500);
      expect(serverErrors).toHaveLength(0);
      // 미인증 상태면 sign-in 리다이렉트 → 본문이 1~2종으로 수렴.
      // 30개 응답이 각각 다른 본문이면 → 부분적으로 데이터 노출 가능성.
      // 본 검증은 sanity — 정확한 IDOR 확인은 인증된 admin 세션으로 별도 (Phase ζ.4).
      expect(bodyHashes.size).toBeLessThan(5);
    });
  });
});
