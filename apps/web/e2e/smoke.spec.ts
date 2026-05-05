/**
 * 인프라 smoke test — Playwright 자체 작동 확인.
 *
 * 시나리오 1·2는 별 PR (Phase J PR B)에서 추가.
 * 이 파일은 webServer 자동 기동 + page.goto가 동작함만 검증.
 */
import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("dev 서버 응답 — sign-in 페이지 접근 가능", async ({ page }) => {
    await page.goto("/ko/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
