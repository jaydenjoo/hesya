/**
 * Epic 12 통합 E2E — admin 운영자 워크플로 (Phase 1-γ.1.6).
 *
 * 시나리오: admin이 분쟁(E12-4) → 결제이상(E12-6) → AI정확도(E12-7) →
 * API정책(E12-8) → 매장해지(E12-9) → KYC큐(E9) 6개 admin 페이지를 차례로
 * 진입하며 각 페이지가 정상 렌더링 + auth guard 통과 + 시드 데이터가
 * 화면에 표시되는지 검증.
 *
 * 본 spec은 통합 시그널 — 각 Task의 단위 e2e는 별도 spec에 존재
 * (store-deletion.spec.ts 등). 여기는 모든 admin 페이지가 한 번의 admin
 * 세션에서 일관되게 작동함을 보증.
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL
 *   - E2E_ADMIN_EMAIL: requireAdminEmail bypass
 *   - E2E_AUTH_USER_ID: admin user_id 채움 (admin-guard E2E bypass)
 */
import { test, expect } from "@playwright/test";
import { apiPolicyAlerts } from "@hesya/database";

import {
  createTestDb,
  resetDb,
  seedDispute,
  seedStore,
  seedStoreDeletionRequest,
  seedStoreOwner,
  seedUser,
} from "./fixtures/db";

const hasDb = Boolean(process.env.HESYA_TEST_DATABASE_URL);
const E2E_USER_ID = process.env.E2E_AUTH_USER_ID;
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;

test.describe("Epic 12 통합 — admin 운영자 6개 큐 순회", () => {
  test.skip(
    !hasDb || !E2E_USER_ID || !E2E_ADMIN_EMAIL,
    "HESYA_TEST_DATABASE_URL + E2E_AUTH_USER_ID + E2E_ADMIN_EMAIL 필요",
  );

  test.beforeEach(async () => {
    const db = createTestDb();
    await resetDb(db);
  });

  test("E12-4 분쟁 → E12-8 API정책 → E12-9 해지 큐: 시드 row 표시 + E12-6/7 빈 큐 렌더링 + E9 KYC 큐 렌더링", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    // ---------- Seed: 1 admin + 1 store + 3 row ----------
    await seedUser(db, { id: userId, email: E2E_ADMIN_EMAIL! });
    const storeId = await seedStore(db, { name: "통합테스트매장" });
    await seedStoreOwner(db, { userId, storeId, role: "owner" });

    // E12-4: 분쟁 1건
    await seedDispute(db, {
      storeId,
      filedByUserId: userId,
      category: "no_show",
      description: "통합테스트 — 노쇼 분쟁 시드",
    });

    // E12-8: API 정책 alert 1건 (inline insert — fixture helper 없음)
    await db.insert(apiPolicyAlerts).values({
      source: "meta-blog",
      title: "[통합테스트] Instagram API 정책 변경 공지",
      link: "https://example.com/integration-test/post-1",
      guid: "integration-test-guid-1",
    });

    // E12-9: 매장 해지 요청 1건 (5일 경과 = D-25)
    await seedStoreDeletionRequest(db, {
      storeId,
      source: "owner",
      requestedByEmail: "owner@example.com",
      reason: "통합테스트 — 자가해지 시드",
      daysAgo: 5,
    });

    // ---------- 1. E12-4 분쟁 처리 큐 ----------
    await page.goto("/ko/admin/disputes");
    await expect(
      page.getByRole("heading", { name: "분쟁 처리 큐" }),
    ).toBeVisible();
    await expect(page.getByText("통합테스트 — 노쇼 분쟁 시드")).toBeVisible();

    // ---------- 2. E12-6 결제이상 모니터링 (빈 큐 OK) ----------
    await page.goto("/ko/admin/payment-monitoring");
    await expect(
      page.getByRole("heading", { name: "결제이상 모니터링" }),
    ).toBeVisible();

    // ---------- 3. E12-7 AI 응답 정확도 (빈 큐 OK) ----------
    await page.goto("/ko/admin/ai-accuracy");
    await expect(
      page.getByRole("heading", { name: "AI 응답 정확도" }),
    ).toBeVisible();

    // ---------- 4. E12-8 API 정책 변경 알림 ----------
    await page.goto("/ko/admin/api-policy-alerts");
    await expect(
      page.getByRole("heading", { name: "API 정책 변경 알림" }),
    ).toBeVisible();
    await expect(
      page.getByText("[통합테스트] Instagram API 정책 변경 공지"),
    ).toBeVisible();

    // ---------- 5. E12-9 매장 해지 ----------
    await page.goto("/ko/admin/store-deletion?status=pending");
    await expect(
      page.getByRole("heading", { name: "매장 해지 / 데이터 삭제" }),
    ).toBeVisible();
    await expect(page.getByText("통합테스트매장")).toBeVisible();

    // ---------- 6. E9 KYC 매장 검토 큐 (Epic 12 인접 — auth guard 일관성) ----------
    await page.goto("/ko/admin/store-verifications");
    await expect(
      page.getByRole("heading", { name: "매장 검토 큐" }),
    ).toBeVisible();
  });
});
