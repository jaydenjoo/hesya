/**
 * E12-9 매장 해지 / 데이터 삭제 — golden-path E2E (PRD §1068).
 *
 * 시나리오:
 *   1. Owner: /store/account/deletion 진입 → 신청 폼 보임 → 사유 입력 + 동의 체크 → 제출
 *   2. Owner: 같은 페이지 새로고침 → D-30 카운터 + 취소 버튼 보임
 *   3. Owner: 취소 → 신청 폼 다시 보임 (deletedAt 복원 검증)
 *   4. Admin: /admin/store-deletion 진입 → cancelled 행 1건 (filter='cancelled')
 *
 * Owner sign-up + Admin login은 phase-1-beta.spec.ts와 동일 패턴 — DB seed +
 * E2E bypass env 사용 (NODE_ENV !== "production"에서만 작동).
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL
 *   - E2E_AUTH_USER_ID: requireStoreOwnerAuth bypass
 *   - E2E_ADMIN_EMAIL: requireAdminEmail bypass
 */
import { test, expect } from "@playwright/test";
import { eq, storeDeletionRequests, stores } from "@hesya/database";

import {
  createTestDb,
  resetDb,
  seedStore,
  seedStoreOwner,
  seedUser,
} from "./fixtures/db";

const hasDb = Boolean(process.env.HESYA_TEST_DATABASE_URL);
const E2E_USER_ID = process.env.E2E_AUTH_USER_ID;
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;

test.describe("E12-9 매장 해지 / 데이터 삭제", () => {
  test.skip(
    !hasDb || !E2E_USER_ID || !E2E_ADMIN_EMAIL,
    "HESYA_TEST_DATABASE_URL + E2E_AUTH_USER_ID + E2E_ADMIN_EMAIL 필요",
  );

  test.beforeEach(async () => {
    const db = createTestDb();
    await resetDb(db);
  });

  test("owner 신청 → grace 카운터 → 취소 → admin 큐에서 cancelled 확인", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    // 0. Seed: owner + store
    await seedUser(db, { id: userId });
    const storeId = await seedStore(db, { name: "테스트 매장" });
    await seedStoreOwner(db, { userId, storeId, role: "owner" });

    // 1. Owner 신청
    await page.goto("/ko/store/account/deletion");
    await expect(
      page.getByRole("heading", { name: "매장 해지 / 데이터 삭제" }),
    ).toBeVisible();
    await page
      .locator("textarea")
      .fill("사업 종료로 인한 자가해지 (E2E 테스트)");
    await page
      .getByLabel(/30일 grace 종료 후 매장 데이터가 영구 삭제됨/)
      .check();
    await page.getByRole("button", { name: "매장 해지 신청" }).click();

    // 2. grace 카운터 + 취소 버튼
    await expect(
      page.getByRole("heading", { name: /매장 해지 진행 중/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "해지 취소" })).toBeVisible();

    // DB 검증: stores.deletedAt set + request row INSERT
    const [storeRow] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));
    expect(storeRow?.deletedAt).not.toBeNull();
    const requestsAfterCreate = await db
      .select()
      .from(storeDeletionRequests)
      .where(eq(storeDeletionRequests.storeId, storeId));
    expect(requestsAfterCreate).toHaveLength(1);
    expect(requestsAfterCreate[0]?.cancelledAt).toBeNull();

    // 3. 취소
    await page.getByRole("button", { name: "해지 취소" }).click();
    await expect(
      page.getByRole("button", { name: "매장 해지 신청" }),
    ).toBeVisible();

    // DB 검증: stores.deletedAt 복원 + request.cancelledAt set
    const [storeAfterCancel] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));
    expect(storeAfterCancel?.deletedAt).toBeNull();
    const cancelledReqs = await db
      .select()
      .from(storeDeletionRequests)
      .where(eq(storeDeletionRequests.storeId, storeId));
    expect(cancelledReqs[0]?.cancelledAt).not.toBeNull();

    // 4. Admin 큐에서 cancelled 확인
    await page.goto("/ko/admin/store-deletion?status=cancelled");
    await expect(
      page.getByRole("heading", { name: "매장 해지 / 데이터 삭제" }),
    ).toBeVisible();
    await expect(page.getByText("테스트 매장")).toBeVisible();
    await expect(page.getByText("취소됨").first()).toBeVisible();
  });
});
