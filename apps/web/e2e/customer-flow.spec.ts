/**
 * Customer-side golden-path E2E — Phase D 디자인 재구성 후 정상 흐름 검증.
 *
 * 시연 prerequisite (L-082) 검증 코드. 시드된 auto_approved 매장 + services +
 * staff로 customer flow가 끊김 없이 작동하는지 확인.
 *
 * 시나리오:
 *   1. /c/store/[id]            — store detail page (Hero + tabs)
 *   2. /c/store/[id]/photos     — photos gallery
 *   3. /c/store/[id]/book/schedule — schedule form (date picker, services, staff)
 *   4. /c/store/[id]/book/confirm  — confirm form (valid query params 시)
 *
 * 실행 전제 (playwright.config.ts 참조):
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL
 *   - dev 서버 자동 기동 (webServer)
 */
import { test, expect } from "@playwright/test";
import { eq, services, sql, stores, staff } from "@hesya/database";
import { createTestDb, resetDb, seedStore } from "./fixtures/db";

test.describe("customer flow — golden path", () => {
  let storeId: string;

  test.beforeAll(async () => {
    const db = createTestDb();
    await resetDb(db);
    storeId = await seedStore(db, { name: "Hesya 데모 헤어샵 (E2E)" });

    // customer-side는 verificationStatus = "auto_approved"만 노출.
    await db
      .update(stores)
      .set({ verificationStatus: "auto_approved" })
      .where(eq(stores.id, storeId));

    // 시술 3종 + 디자이너 2명 (BookSchedule 기본 표시 확인용)
    await db.insert(services).values([
      {
        storeId,
        nameKo: "커트",
        nameEn: "Cut",
        priceKrw: 35000,
        durationMinutes: 40,
        category: "haircut",
      },
      {
        storeId,
        nameKo: "펌",
        nameEn: "Perm",
        priceKrw: 120000,
        durationMinutes: 150,
        category: "perm",
      },
      {
        storeId,
        nameKo: "염색",
        nameEn: "Color",
        priceKrw: 95000,
        durationMinutes: 120,
        category: "color",
      },
    ]);
    await db.insert(staff).values([
      { storeId, name: "디자이너 A", languages: ["ko", "en"] },
      { storeId, name: "디자이너 B", languages: ["ko", "ja"] },
    ]);
  });

  test("Detail page renders store name + tabs", async ({ page }) => {
    await page.goto(`/ko/c/store/${storeId}`);
    await expect(page).toHaveURL(new RegExp(`/ko/c/store/${storeId}`));
    // Store name이 hero 어딘가에 표시
    await expect(
      page.getByText("Hesya 데모 헤어샵 (E2E)").first(),
    ).toBeVisible();
  });

  test("Photos page renders gallery shell", async ({ page }) => {
    await page.goto(`/ko/c/store/${storeId}/photos`);
    await expect(page).toHaveURL(/\/photos$/);
  });

  test("Schedule page renders services + staff chips", async ({ page }) => {
    await page.goto(`/ko/c/store/${storeId}/book/schedule`);
    await expect(page).toHaveURL(/\/book\/schedule$/);
    // 시드된 서비스 라벨 (Korean)이 보임
    await expect(page.getByText("커트").first()).toBeVisible();
    await expect(page.getByText("디자이너 A").first()).toBeVisible();
  });

  test("Schedule page works in English locale", async ({ page }) => {
    await page.goto(`/en/c/store/${storeId}/book/schedule`);
    await expect(page).toHaveURL(/\/en\//);
    // nameEn fallback이 활성
    await expect(page.getByText("Cut").first()).toBeVisible();
  });

  test.afterAll(async () => {
    const db = createTestDb();
    // 위 시드 cleanup — 다른 spec과 격리.
    await db.execute(sql`SELECT 1`); // no-op smoke
    await resetDb(db);
  });
});
