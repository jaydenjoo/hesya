/**
 * Inbox E2E 시나리오 — Epic 1 1A 수용 기준 검증.
 *
 * 시나리오 1: 인박스 표시 + 한국어 답변 발송
 * 시나리오 2: 24h 메시징 윈도우 만료 시 composer disabled
 *
 * 실행 전제:
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL (없으면 전체 skip)
 *   - dev 서버 자동 기동 (playwright.config.ts webServer)
 *   - IG API mock 자동 기동 (port 4201)
 *
 * 인증 우회:
 *   - playwright.config.ts에서 dev 서버에 환경변수 주입 안 됨 — 시나리오별로
 *     E2E_AUTH_USER_ID를 시드 user id로 설정. setup hook에서 user 시드 후
 *     해당 id를 dev 서버 env로 전파해야 하나, 1A는 단순화: dev 서버를
 *     E2E_AUTH_USER_ID=test_e2e_user 고정으로 시작 (별도 webServer entry).
 *     본 시나리오에서는 그 user_id로 store_owner를 시드.
 */
import { test, expect } from "@playwright/test";
import {
  createTestDb,
  resetDb,
  seedStore,
  seedCustomer,
  seedUser,
  seedStoreOwner,
  seedStoreIntegration,
  seedConversation,
  seedMessage,
} from "./fixtures/db";

const hasDb = Boolean(process.env.HESYA_TEST_DATABASE_URL);
const E2E_USER_ID = process.env.E2E_AUTH_USER_ID;

test.describe("Inbox E2E (시나리오 1, 2)", () => {
  test.skip(
    !hasDb || !E2E_USER_ID,
    "HESYA_TEST_DATABASE_URL + E2E_AUTH_USER_ID 필요",
  );

  test.beforeEach(async () => {
    const db = createTestDb();
    await resetDb(db);
  });

  test("시나리오 1: 인박스 thread 표시 + 한국어 답변 발송", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    // store_owners.userId → users.id (CASCADE) FK 존재 — users row를 먼저 시드.
    // E2E_AUTH_USER_ID와 동일 id로 INSERT (env로 dev 서버 bypass 매칭).
    await seedUser(db, { id: userId });
    const storeId = await seedStore(db);
    await seedStoreOwner(db, { userId, storeId, role: "owner" });
    await seedStoreIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_demo",
      externalPageId: "page_demo",
    });
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_111",
    });
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const convId = await seedConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "thread_demo",
      messagingWindowExpiresAt: expiresAt,
      lastInboundAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    await seedMessage(db, {
      conversationId: convId,
      direction: "inbound",
      text: "안녕하세요, 단발 가능?",
    });

    // 2. 인박스 진입
    await page.goto("/ko/store/inbox");

    // 3. inbound 메시지 보임
    await expect(page.getByText("안녕하세요, 단발 가능?")).toBeVisible({
      timeout: 8000,
    });

    // 4. thread 클릭 → MessageView 활성화
    await page.getByRole("button").filter({ hasText: "안녕하세요" }).click();

    // 5. composer에 답변 입력
    const reply = "네! 오후 3시 가능합니다.";
    await page.getByRole("textbox").fill(reply);
    await page.getByRole("button", { name: /전송|send/i }).click();

    // 6. 5초 polling 안에 outbound UI에 등장
    await expect(page.getByText(reply)).toBeVisible({ timeout: 8000 });
  });

  test("시나리오 2: 24h 메시징 윈도우 만료 시 composer disabled", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    await seedUser(db, { id: userId });
    const storeId = await seedStore(db);
    await seedStoreOwner(db, { userId, storeId, role: "owner" });
    await seedStoreIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_demo",
      externalPageId: "page_demo",
    });
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_222",
    });
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000); // 1시간 전 만료
    const convId = await seedConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "thread_expired",
      messagingWindowExpiresAt: expiredAt,
      lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    await seedMessage(db, {
      conversationId: convId,
      direction: "inbound",
      text: "오래된 메시지",
    });

    await page.goto("/ko/store/inbox");
    await expect(page.getByText("오래된 메시지")).toBeVisible({
      timeout: 8000,
    });

    // thread 선택
    await page.getByRole("button").filter({ hasText: "오래된 메시지" }).click();

    // composer textarea가 disabled
    await expect(page.getByRole("textbox")).toBeDisabled();

    // 만료 안내가 보임 (Inbox.window.expired key)
    await expect(page.getByText(/24시간|expired/i)).toBeVisible();
  });
});
