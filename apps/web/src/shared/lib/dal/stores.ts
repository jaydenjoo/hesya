import "server-only";
import {
  and,
  conversations,
  eq,
  storeIntegrations,
  storeVerifications,
  stores,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Store = typeof stores.$inferSelect;

/**
 * 외부 채널 계정 ID로 매장 1건 조회.
 *
 * Instagram webhook이 도착하면 `entry.id` (= IG 비즈니스 계정 ID)로 매장을
 * 라우팅한다. 미연결 매장의 webhook은 무시 (caller가 continue).
 */
export async function findStoreByExternalAccount(
  db: DbClient,
  input: {
    channel: Channel;
    externalAccountId: string;
  },
): Promise<{ id: string } | null> {
  const rows = await db
    .select({ id: stores.id })
    .from(stores)
    .innerJoin(storeIntegrations, eq(storeIntegrations.storeId, stores.id))
    .where(
      and(
        eq(storeIntegrations.channel, input.channel),
        eq(storeIntegrations.externalAccountId, input.externalAccountId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * conversationId로 매장 이름(`stores.name`)만 조회. Phase B-2 AI 트리거가
 * `buildPrompt` 입력의 `storeName`을 채우기 위해 사용.
 *
 * - conversation 없거나 store join 실패 시 `null`. Caller가 안전 종료 결정.
 * - 필요한 컬럼만 `select` (CLAUDE.md: `select('*')` 금지).
 */
export async function findStoreNameByConversationId(
  db: DbClient,
  conversationId: string,
): Promise<string | null> {
  const rows = await db
    .select({ name: stores.name })
    .from(stores)
    .innerJoin(conversations, eq(conversations.storeId, stores.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  return rows[0]?.name ?? null;
}

/**
 * Phase 1-β — 매장의 bot_mode 토글 조회.
 *
 * `false`(기본) → owner 검수·승인 모드 (AI 초안을 사장이 확인 후 전송).
 * `true`         → AI 자동 모드 (Phase 1-β 학습 가설 H1 검증용).
 *
 * 매장이 존재하지 않으면 `false` 반환 (안전한 기본값 — bot 자동 전송 회피).
 */
export async function getStoreBotMode(
  db: DbClient,
  storeId: string,
): Promise<boolean> {
  const rows = await db
    .select({ botMode: stores.botMode })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  return rows[0]?.botMode ?? false;
}

/**
 * Phase 1-β — 매장의 bot_mode 토글 설정.
 */
export async function setStoreBotMode(
  db: DbClient,
  storeId: string,
  value: boolean,
): Promise<void> {
  await db.update(stores).set({ botMode: value }).where(eq(stores.id, storeId));
}

/**
 * Phase 1-β — verification_status='manual_review' 상태인 매장 목록.
 * Admin 검수 대시보드가 사용.
 *
 * - 필요한 컬럼만 `select` (CLAUDE.md: `select('*')` 금지).
 */
export async function listStoresPendingReview(
  db: DbClient,
): Promise<Pick<Store, "id" | "name" | "createdAt">[]> {
  return db
    .select({
      id: stores.id,
      name: stores.name,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .where(eq(stores.verificationStatus, "manual_review"));
}

/**
 * Phase 1-β — 매장 수동 승인.
 *
 * stores.verification_status='auto_approved'와 storeVerifications 행
 * (verification_status, reviewedBy, reviewedAt)을 동일 트랜잭션에서 갱신.
 * 한 쪽만 갱신되면 admin UI/cron 재검증과 상태 mismatch → 트랜잭션 필수.
 */
export async function approveStore(
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

/**
 * Phase 1-β — 매장 수동 거부.
 *
 * stores.verification_status='rejected'와 storeVerifications 행
 * (verification_status, reviewedBy, reviewedAt, rejectionReason)을 동일
 * 트랜잭션에서 갱신.
 */
export async function rejectStore(
  db: DbClient,
  input: {
    storeId: string;
    verificationId: string;
    reviewerId: string;
    reason: string;
  },
): Promise<void> {
  await db.transaction(async (tx) => {
    const reviewedAt = new Date();
    await tx
      .update(stores)
      .set({ verificationStatus: "rejected" })
      .where(eq(stores.id, input.storeId));
    await tx
      .update(storeVerifications)
      .set({
        verificationStatus: "rejected",
        reviewedBy: input.reviewerId,
        reviewedAt,
        rejectionReason: input.reason,
      })
      .where(eq(storeVerifications.id, input.verificationId));
  });
}
