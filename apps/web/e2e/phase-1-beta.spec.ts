/**
 * Phase 1-β Beta-Ready Slice — golden-path E2E (Task E).
 *
 * 핵심 학습 검증 (H1, spec §6): "AI 초안 → owner 검수·승인" 모드의
 * UI 흐름이 실제로 작동하여 수정률(approve_no_edit / approve_edited / skip)을
 * 측정할 수 있는 데이터 경로가 존재함을 확인.
 *
 * ## 시나리오 형태 결정 (Task E plan 옵션 a/b/c)
 *
 * 옵션 (c) Simplified — DraftReviewPanel render + 승인 click을 핵심 단일
 * 경로로 검증. Owner 자체 sign-up + Admin 승인은 Better Auth 세션 cookie가
 * 필요하므로 (`requireAdminEmail` + `submitKycApplication` 모두 bypass 없음)
 * E2E에서 직접 호출 불가. 대신 DB 상태 전이를 직접 시뮬:
 *
 *   1. seed: user + manual_review 매장 + store_owner + verification 행
 *   2. (admin 승인 시뮬) stores + storeVerifications 직접 update → auto_approved 전환
 *   3. seed: IG integration + conversation (활성 메시징 윈도우) + inbound + pending_review draft
 *   4. /store/inbox 진입 (E2E_AUTH_USER_ID bypass 활성)
 *   5. DraftReviewPanel 가시성 확인
 *   6. "승인 + 전송" 클릭 → DraftReviewPanel 사라짐
 *   7. DB 검증: messages.draft_status='sent' + status='sent'
 *
 * /onboarding/kyc + /admin/store-verifications UI는 본 E2E scope OUT —
 * Better Auth 세션 cookie 생성이 매우 복잡하고, plan §E에서 옵션 (c)를
 * "DraftReviewPanel 렌더링까지만"으로 명시 허용했음. 실제 베타 1곳 배치는
 * `docs/runbook.md` "베타 매장 onboarding 절차"에 따라 Jayden 수동 검증.
 *
 * 실행 전제 (inbox.spec.ts와 동일):
 *   - HESYA_TEST_DATABASE_URL: 격리된 PostgreSQL
 *   - E2E_AUTH_USER_ID: requireStoreOwnerAuth bypass용 (NODE_ENV !== "production"에서만)
 *   - dev 서버 + IG mock 자동 기동 (playwright.config.ts webServer)
 */
import { test, expect } from "@playwright/test";
import {
  conversations,
  eq,
  messages,
  stores,
  storeVerifications,
  type DbClient,
} from "@hesya/database";
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

async function findMessageById(db: DbClient, id: string) {
  const rows = await db
    .select({
      id: messages.id,
      status: messages.status,
      draftStatus: messages.draftStatus,
    })
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * approveStore DAL의 트랜잭션 동작을 E2E 환경에서 그대로 재현.
 * server-only DAL은 Playwright Node 환경에서 import 불가 → drizzle 직접 호출.
 * (`apps/web/src/shared/lib/dal/stores.ts#approveStore` 참고)
 */
async function adminApproveStore(
  db: DbClient,
  input: { storeId: string; verificationId: string; reviewerId: string },
): Promise<void> {
  await db.transaction(async (tx) => {
    const reviewedAt = new Date();
    await tx
      .update(stores)
      .set({ verificationStatus: "auto_approved" })
      .where(eq(stores.id, input.storeId));
    await tx
      .update(storeVerifications)
      .set({
        verificationStatus: "auto_approved",
        reviewedBy: input.reviewerId,
        reviewedAt,
      })
      .where(eq(storeVerifications.id, input.verificationId));
  });
}

test.describe("Phase 1-β Beta-Ready Slice — golden path", () => {
  test.skip(
    !hasDb || !E2E_USER_ID,
    "HESYA_TEST_DATABASE_URL + E2E_AUTH_USER_ID 필요",
  );

  test.beforeEach(async () => {
    const db = createTestDb();
    await resetDb(db);
  });

  test("KYC 승인 → pending_review 초안 → 승인+전송 → DB 'sent' 확정", async ({
    page,
  }) => {
    const db = createTestDb();
    const userId = E2E_USER_ID!;

    // 1) Owner sign-up + KYC 신청 (DB 시뮬)
    //    실제 흐름: /onboarding/kyc 폼 → submitKycApplication 트랜잭션
    //    여기선 manual_review 매장 + store_owner + verification 직접 시드.
    await seedUser(db, { id: userId });
    const storeId = await seedStore(db);
    await seedStoreOwner(db, { userId, storeId, role: "owner" });

    // 매장을 manual_review로 표시 (Task B 트랜잭션의 결과 상태 시뮬).
    await db
      .update(stores)
      .set({ verificationStatus: "manual_review" })
      .where(eq(stores.id, storeId));

    const [verification] = await db
      .insert(storeVerifications)
      .values({
        storeId,
        businessNumber: "1234567890",
        representativeName: "테스트 대표",
        declarationNoMassage: true,
        declarationNoMedicalDevice: true,
        declarationNoOrientalMedicine: true,
        selfDeclarationSignedAt: new Date(),
        verificationStatus: "manual_review",
      })
      .returning({ id: storeVerifications.id });
    if (!verification) throw new Error("verification seed failed");

    // 2) Admin 승인 (DAL 트랜잭션 시뮬 — UI 우회)
    await adminApproveStore(db, {
      storeId,
      verificationId: verification.id,
      reviewerId: userId,
    });

    // 3) IG integration + conversation + pending_review 초안 시드.
    //    inbox-client는 hasIgIntegration=false면 ConnectCTA 표시 → integration 필수.
    await seedStoreIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_demo",
      externalPageId: "page_demo",
    });
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: "igsid_beta",
    });
    // 활성 메시징 윈도우 — approveDraft가 windowExpiresAt > now 검사함.
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const convId = await seedConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "thread_beta",
      messagingWindowExpiresAt: expiresAt,
      lastInboundAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    // inbound 1건 (history 표시용).
    await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId,
      direction: "inbound",
      text: "안녕하세요, 영어 가능?",
    });
    // outbound pending_review 초안 — DraftReviewPanel가 마지막 메시지일 때 표시.
    const draftId = await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId,
      direction: "outbound",
      text: "Hello! Yes, English is fine.",
      status: "ai_draft",
      draftStatus: "pending_review",
    });

    // ThreadItem은 conversations.lastMessagePreview를 표시 → 시드 시점에
    // 직접 set (production 흐름은 updateLastMessage DAL이 메시지 처리 시 set).
    await db
      .update(conversations)
      .set({
        lastMessagePreview: "Hello! Yes, English is fine.",
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, convId));

    // 4) Inbox 진입 — E2E_AUTH_USER_ID bypass로 store_owners.userId 매칭.
    await page.goto("/ko/store/inbox");

    // 5) thread 선택 → DraftReviewPanel 가시성 확인.
    //    ThreadItem은 lastMessagePreview를 렌더 → 위에서 직접 set 한 텍스트로 매칭.
    const thread = page
      .getByRole("button")
      .filter({ hasText: "Hello! Yes, English is fine." });
    await expect(thread).toBeVisible({ timeout: 8000 });
    await thread.click();

    const panel = page.getByTestId("draft-review-panel");
    await expect(panel).toBeVisible({ timeout: 8000 });
    await expect(
      panel.getByRole("button", { name: /승인.*전송/ }),
    ).toBeEnabled();

    // 6) "승인 + 전송" 클릭 — 변경 없이 그대로 승인.
    await panel.getByRole("button", { name: /승인.*전송/ }).click();

    // 7) DB 검증 — approveDraft 액션이 messages.status='sent' +
    //    draft_status='sent'로 전환했는지 확인.
    //    polling: server action + revalidatePath + IG mock send까지 비동기.
    await expect(async () => {
      const row = await findMessageById(db, draftId);
      expect(row?.status).toBe("sent");
      expect(row?.draftStatus).toBe("sent");
    }).toPass({ timeout: 15_000, intervals: [500, 1000, 2000] });

    // UI: DraftReviewPanel는 status='sent' 전환되면 pickPendingReview에서
    // null → 사라짐. revalidatePath + 5s polling 후 자연 갱신.
    await expect(panel).toBeHidden({ timeout: 15_000 });
  });
});
