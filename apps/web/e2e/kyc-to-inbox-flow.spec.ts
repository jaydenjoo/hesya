/**
 * γ.2.1 KYC 제출 → admin 승인 → integration 연결 → inbox 진입 통합 E2E.
 *
 * phase-1-beta.spec.ts와의 차이: phase-1-beta는 admin 승인을 DB 직접 update로
 * 시뮬했으나, 본 spec은 **admin이 /admin/store-verifications/[id] 페이지에서
 * 진짜 "승인" 버튼을 클릭**하는 흐름까지 e2e로 cover. PROGRESS L-082의 "E9
 * KYC 88% — admin 검수 E2E 흐름만 차단" 갭을 메움.
 *
 * 시나리오:
 *   1. seed: user(admin+owner 동일) + manual_review store + verification
 *   2. admin이 /admin/store-verifications 큐 진입 → 매장 row 보임
 *   3. admin이 상세 페이지 진입 → "승인" 버튼 클릭 → DB auto_approved 확인
 *   4. seed: IG integration + conversation + inbound + pending_review draft
 *   5. owner가 /store/inbox 진입 → thread + DraftReviewPanel 보임
 *   6. "승인 + 전송" 클릭 → DB messages.status='sent' 확인
 *
 * IG OAuth는 mock(integration 직접 seed)으로 우회 — phase-1-beta 패턴 일치.
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL
 *   - E2E_AUTH_USER_ID: requireStoreOwnerAuth + admin-guard userId
 *   - E2E_ADMIN_EMAIL: requireAdminEmail bypass (같은 user의 email)
 */
import { test, expect } from "@playwright/test";
import {
  conversations,
  eq,
  messages,
  stores,
  storeVerifications,
} from "@hesya/database";

import {
  createTestDb,
  resetDb,
  seedConversation,
  seedCustomer,
  seedManualReviewVerification,
  seedMessage,
  seedStore,
  seedStoreIntegration,
  seedStoreOwner,
  seedUser,
} from "./fixtures/db";

const hasDb = Boolean(process.env.HESYA_TEST_DATABASE_URL);
const E2E_USER_ID = process.env.E2E_AUTH_USER_ID;
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;

test.describe("γ.2.1 KYC 제출 → admin 승인 → inbox 도달 통합 E2E", () => {
  test.skip(
    !hasDb || !E2E_USER_ID || !E2E_ADMIN_EMAIL,
    "HESYA_TEST_DATABASE_URL + E2E_AUTH_USER_ID + E2E_ADMIN_EMAIL 필요",
  );

  test.beforeEach(async () => {
    const db = createTestDb();
    await resetDb(db);
  });

  test("admin이 진짜 클릭으로 승인 → owner inbox에서 draft 승인+전송 → DB sent 확정", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    // ---------- 1) Seed: admin+owner 동일 user + manual_review 매장 ----------
    await seedUser(db, { id: userId, email: E2E_ADMIN_EMAIL! });
    const storeId = await seedStore(db, { name: "γ.2.1 통합테스트 매장" });
    await seedStoreOwner(db, { userId, storeId, role: "owner" });
    const verificationId = await seedManualReviewVerification(db, { storeId });

    // ---------- 2) admin 큐 진입 → 매장 row 보임 ----------
    await page.goto("/ko/admin/store-verifications");
    await expect(
      page.getByRole("heading", { name: "매장 검토 큐" }),
    ).toBeVisible();
    await expect(page.getByText("γ.2.1 통합테스트 매장")).toBeVisible();

    // ---------- 3) 상세 페이지 → 진짜 "승인" 버튼 클릭 ----------
    await page.goto(`/ko/admin/store-verifications/${verificationId}`);
    await expect(
      page.getByRole("heading", { name: "매장 검토 상세" }),
    ).toBeVisible();
    await expect(page.getByText("γ.2.1 통합테스트 매장")).toBeVisible();

    page.on("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: /^승인$/ }).click();

    // 승인 후 큐로 redirect 또는 상태 변경 — DB 검증으로 확인 (UI redirect 동작이
    // 환경마다 다를 수 있음).
    await page
      .waitForFunction(() => true, {}, { timeout: 1000 })
      .catch(() => {});
    // approveStoreKyc는 revalidatePath + state 갱신 → 잠시 대기 후 DB 확인.
    await page.waitForTimeout(1500);

    const [storeAfter] = await db
      .select({ status: stores.verificationStatus })
      .from(stores)
      .where(eq(stores.id, storeId));
    expect(storeAfter?.status).toBe("auto_approved");

    const [verificationAfter] = await db
      .select({ status: storeVerifications.verificationStatus })
      .from(storeVerifications)
      .where(eq(storeVerifications.id, verificationId));
    expect(verificationAfter?.status).toBe("auto_approved");

    // ---------- 4) Seed: IG integration + conversation + draft ----------
    await seedStoreIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_gamma_2_1",
      externalPageId: "page_gamma_2_1",
    });
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_gamma_2_1",
    });
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const convId = await seedConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "thread_gamma_2_1",
      messagingWindowExpiresAt: expiresAt,
      lastInboundAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId,
      direction: "inbound",
      text: "안녕하세요, 영어 가능?",
    });
    const draftId = await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId,
      direction: "outbound",
      text: "Hello! Yes, English is fine.",
      status: "ai_draft",
      draftStatus: "pending_review",
    });

    await db
      .update(conversations)
      .set({
        lastMessagePreview: "Hello! Yes, English is fine.",
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, convId));

    // ---------- 5) Owner inbox 진입 → thread + DraftReviewPanel ----------
    await page.goto("/ko/store/inbox");
    const thread = page
      .getByRole("button")
      .filter({ hasText: "Hello! Yes, English is fine." });
    await expect(thread).toBeVisible({ timeout: 8000 });
    await thread.click();

    const panel = page.getByTestId("draft-review-panel");
    await expect(panel).toBeVisible({ timeout: 8000 });

    // ---------- 6) "승인 + 전송" 클릭 → DB sent 확인 ----------
    await panel.getByRole("button", { name: /승인.*전송/ }).click();

    await expect(panel).not.toBeVisible({ timeout: 8000 });

    const [draftAfter] = await db
      .select({
        status: messages.status,
        draftStatus: messages.draftStatus,
      })
      .from(messages)
      .where(eq(messages.id, draftId));
    expect(draftAfter?.status).toBe("sent");
    expect(draftAfter?.draftStatus).toBe("sent");
  });
});
