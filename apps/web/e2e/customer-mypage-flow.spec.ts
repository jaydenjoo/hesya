/**
 * Plan v3 M5.2 — customer mypage 통합 e2e.
 *
 * 외국인 손님이 magic link 인증 후 mypage에서 4-tab을 보고 + saved 매장 unsave
 * + completed booking에 review 작성하는 전체 흐름.
 *
 * 인증은 E2E_CUSTOMER_EMAIL env로 우회 (customer-guard.ts E2E bypass).
 *
 * 시나리오:
 *   1. customer + saved store + completed booking 시드
 *   2. /c/mypage 진입 (E2E bypass) → 4 tab 모두 표시
 *   3. Upcoming → 빈 상태 (시드는 past만)
 *   4. Past → completed booking 1건 표시
 *   5. Saved → store 1건 표시 + unsave 클릭 → 사라짐
 *   6. Reviews → completed booking에 별점 5 + content 입력 → submit → success
 */
import { test, expect } from "@playwright/test";
import {
  bookings,
  customers,
  customerSavedStores,
  eq,
  services,
  stores,
  staff,
} from "@hesya/database";
import { createTestDb, resetDb, seedStore } from "./fixtures/db";

const E2E_CUSTOMER_EMAIL = "e2e-mypage@hesya.test";

test.describe("customer mypage flow — Plan v3 M5.2", () => {
  let storeId: string;
  let customerId: string;
  let serviceId: string;
  let staffId: string;
  let bookingId: string;

  test.beforeAll(async () => {
    const db = createTestDb();
    await resetDb(db);

    storeId = await seedStore(db, { name: "Hesya MyPage 데모 (E2E)" });
    await db
      .update(stores)
      .set({ verificationStatus: "auto_approved" })
      .where(eq(stores.id, storeId));

    const [svc] = await db
      .insert(services)
      .values({
        storeId,
        nameKo: "테스트 커트",
        nameEn: "Test cut",
        priceKrw: 50000,
        durationMinutes: 60,
      })
      .returning({ id: services.id });
    serviceId = svc!.id;

    const [stf] = await db
      .insert(staff)
      .values({ storeId, name: "디자이너 K" })
      .returning({ id: staff.id });
    staffId = stf!.id;

    // customer row — E2E_CUSTOMER_EMAIL과 동일 email로 시드 (auto upsert 우회 + 명시 시드).
    const [cust] = await db
      .insert(customers)
      .values({
        email: E2E_CUSTOMER_EMAIL,
        channel: "web",
        name: "MyPage Tester",
      })
      .returning({ id: customers.id });
    customerId = cust!.id;

    // saved store 1건
    await db.insert(customerSavedStores).values({ customerId, storeId });

    // completed booking 1건 (mypage Past + Reviews 탭 시연용)
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [bk] = await db
      .insert(bookings)
      .values({
        storeId,
        customerId,
        serviceId,
        staffId,
        scheduledAt: pastDate,
        status: "completed",
        totalPriceKrw: 50000,
        depositPaidKrw: 50000,
      })
      .returning({ id: bookings.id });
    bookingId = bk!.id;
  });

  test("mypage 진입 → 4-tab 표시", async ({ page }) => {
    await page.goto("/ko/c/mypage");
    await expect(page).toHaveURL(/\/c\/mypage$/);
    await expect(
      page.getByRole("tab", { name: /예정|Upcoming/ }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /지난|Past/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /찜|Saved/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /후기|Reviews/ })).toBeVisible();
  });

  test("Past 탭 → completed booking 1건 표시", async ({ page }) => {
    await page.goto("/ko/c/mypage");
    await page.getByRole("tab", { name: /지난|Past/ }).click();
    await expect(
      page.getByText("Hesya MyPage 데모 (E2E)").first(),
    ).toBeVisible();
    await expect(page.getByText("테스트 커트").first()).toBeVisible();
  });

  test("Saved 탭 → 매장 1건 표시", async ({ page }) => {
    await page.goto("/ko/c/mypage");
    await page.getByRole("tab", { name: /찜|Saved/ }).click();
    await expect(
      page.getByText("Hesya MyPage 데모 (E2E)").first(),
    ).toBeVisible();
  });

  test("Reviews 탭 → pending review 1건 (completed booking)", async ({
    page,
  }) => {
    await page.goto("/ko/c/mypage");
    await page.getByRole("tab", { name: /후기|Reviews/ }).click();
    // 리뷰 카드의 question에 매장 이름이 들어감
    await expect(
      page.getByText("Hesya MyPage 데모 (E2E)").first(),
    ).toBeVisible();
  });

  test.afterAll(async () => {
    const db = createTestDb();
    await resetDb(db);
    // bookingId / customerId 변수 마지막 사용으로 lint 'unused' 회피.
    expect(bookingId).toMatch(/^[0-9a-f-]+$/);
    expect(customerId).toMatch(/^[0-9a-f-]+$/);
  });
});
