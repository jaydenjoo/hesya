import "server-only";
import {
  and,
  conversations,
  desc,
  eq,
  ilike,
  isNull,
  or,
  reviews,
  sql,
  storeIntegrations,
  storeVerifications,
  stores,
  type BusinessHours,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Store = typeof stores.$inferSelect;
type StoreVerification = typeof storeVerifications.$inferSelect;

export type StoreSettings = {
  id: string;
  name: string;
  phone: string | null;
  address: unknown;
  businessHours: BusinessHours | null;
};

/**
 * 외부 채널 계정 ID로 매장 1건 조회.
 *
 * Instagram webhook이 도착하면 `entry.id` (= IG 비즈니스 계정 ID)로 매장을
 * 라우팅한다. 미연결 매장의 webhook은 무시 (caller가 continue).
 *
 * E12-9 soft-delete: 30일 grace 진행 중 매장(`stores.deleted_at IS NOT NULL`)
 * 은 외부 webhook 라우팅 대상에서 제외 (해지 신청 즉시 inbound 차단).
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
        isNull(stores.deletedAt),
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
 * Phase 1-β — admin KYC 검토 상세 페이지가 사용하는 단일 round-trip 조회.
 *
 * `stores ⨝ storeVerifications` innerJoin으로 1회 쿼리.
 * 매장이 없거나 verification 행이 없으면 `null` (caller가 `notFound()` 결정).
 *
 * - 페이지가 실제 표시하는 컬럼만 projection (CLAUDE.md: `select('*')` 금지).
 * - 한 store에 여러 verification 행이 가능하지만 Phase 1-β는 1:1 (Task B
 *   트랜잭션이 1건만 INSERT) → `limit(1)`로 첫 행 반환.
 */
export async function getStoreVerificationDetail(
  db: DbClient,
  storeId: string,
): Promise<{
  store: Pick<
    Store,
    "id" | "name" | "phone" | "address" | "businessLicenseImageUrl"
  >;
  verification: Pick<
    StoreVerification,
    | "id"
    | "businessNumber"
    | "representativeName"
    | "declarationNoMassage"
    | "declarationNoMedicalDevice"
    | "declarationNoOrientalMedicine"
  >;
} | null> {
  const rows = await db
    .select({
      storeId: stores.id,
      storeName: stores.name,
      phone: stores.phone,
      address: stores.address,
      businessLicenseImageUrl: stores.businessLicenseImageUrl,
      verificationId: storeVerifications.id,
      businessNumber: storeVerifications.businessNumber,
      representativeName: storeVerifications.representativeName,
      declarationNoMassage: storeVerifications.declarationNoMassage,
      declarationNoMedicalDevice: storeVerifications.declarationNoMedicalDevice,
      declarationNoOrientalMedicine:
        storeVerifications.declarationNoOrientalMedicine,
    })
    .from(stores)
    .innerJoin(storeVerifications, eq(storeVerifications.storeId, stores.id))
    .where(eq(stores.id, storeId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    store: {
      id: row.storeId,
      name: row.storeName,
      phone: row.phone,
      address: row.address,
      businessLicenseImageUrl: row.businessLicenseImageUrl,
    },
    verification: {
      id: row.verificationId,
      businessNumber: row.businessNumber,
      representativeName: row.representativeName,
      declarationNoMassage: row.declarationNoMassage,
      declarationNoMedicalDevice: row.declarationNoMedicalDevice,
      declarationNoOrientalMedicine: row.declarationNoOrientalMedicine,
    },
  };
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

/**
 * Plan v3 M3.3 — 매장 owner settings 페이지에서 사용. 매장 owner가 편집할 수
 * 있는 mutable 필드(name, phone, address, businessHours)만 projection.
 *
 * 인증된 owner가 자기 매장만 조회 — RLS는 service_role bypass라 caller에서
 * `requireStoreOwnerAuth(storeId)` 가드 필수.
 */
export async function getStoreSettings(
  db: DbClient,
  storeId: string,
): Promise<StoreSettings | null> {
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      phone: stores.phone,
      address: stores.address,
      businessHours: stores.businessHours,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Plan v3 M3.3 — 매장 owner settings 업데이트. 부분 갱신 (제공된 필드만).
 * businessHours는 null 명시 시 컬럼을 NULL로 비움 (= 기본값 fallback 10:00~20:00).
 */
export async function updateStoreSettings(
  db: DbClient,
  input: {
    storeId: string;
    name?: string;
    phone?: string | null;
    address?: unknown;
    businessHours?: BusinessHours | null;
  },
): Promise<void> {
  const patch: Partial<{
    name: string;
    phone: string | null;
    address: unknown;
    businessHours: BusinessHours | null;
  }> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.address !== undefined) patch.address = input.address;
  if (input.businessHours !== undefined)
    patch.businessHours = input.businessHours;
  if (Object.keys(patch).length === 0) return;
  await db.update(stores).set(patch).where(eq(stores.id, input.storeId));
}

export type PublicStore = {
  id: string;
  name: string;
  category: string | null;
  region: string | null;
  address: unknown;
  businessHours: BusinessHours | null;
  /** avg(reviews.rating). 리뷰 0건 매장은 null → UI에서 rating bar 숨김. */
  rating: number | null;
  /** count(reviews.rating). 리뷰 0건이면 0. */
  reviewCount: number;
};

/**
 * Plan v3 M2.1 — customer-side public 매장 조회. `auto_approved` 매장만 노출
 * (rejected/manual_review/pending은 외부 손님에게 보이면 안 됨). soft-delete된
 * 매장은 30일 grace 중이어도 외부 view 차단.
 *
 * stores.slug 컬럼이 없어 path param은 UUID. M5 이후 SEO 단계에서 slug 도입 시
 * 본 함수에 `getStorePublicBySlug` 추가 후 라우트만 갈아치우면 됨.
 */
export async function getStorePublicById(
  db: DbClient,
  id: string,
): Promise<PublicStore | null> {
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      category: stores.category,
      region: stores.region,
      address: stores.address,
      businessHours: stores.businessHours,
      rating: sql<number | null>`avg(${reviews.rating})::float`.as("rating"),
      reviewCount: sql<number>`count(${reviews.rating})::int`.as(
        "review_count",
      ),
    })
    .from(stores)
    .leftJoin(reviews, eq(reviews.storeId, stores.id))
    .where(
      and(
        eq(stores.id, id),
        eq(stores.verificationStatus, "auto_approved"),
        isNull(stores.deletedAt),
      ),
    )
    .groupBy(
      stores.id,
      stores.name,
      stores.category,
      stores.region,
      stores.address,
      stores.businessHours,
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Plan v3 M4.5 — customer landing 매장 list.
 *
 * `auto_approved` + non-soft-deleted 매장만. region/search 옵션 필터.
 * search는 매장 이름 ilike 매칭 (subset match, case-insensitive). region은
 * 정확 매칭 (chip filter).
 *
 * 정렬: createdAt desc — 최신 매장 우선. limit 기본 24.
 */
export async function listPublicStores(
  db: DbClient,
  opts: { region?: string; search?: string; limit?: number } = {},
): Promise<PublicStore[]> {
  const conditions = [
    eq(stores.verificationStatus, "auto_approved"),
    isNull(stores.deletedAt),
  ];
  if (opts.region && opts.region.trim()) {
    conditions.push(eq(stores.region, opts.region.trim()));
  }
  if (opts.search && opts.search.trim()) {
    const q = `%${opts.search.trim()}%`;
    const named = ilike(stores.name, q);
    const regioned = ilike(stores.region, q);
    const orClause = or(named, regioned);
    if (orClause) conditions.push(orClause);
  }
  return db
    .select({
      id: stores.id,
      name: stores.name,
      category: stores.category,
      region: stores.region,
      address: stores.address,
      businessHours: stores.businessHours,
      rating: sql<number | null>`avg(${reviews.rating})::float`.as("rating"),
      reviewCount: sql<number>`count(${reviews.rating})::int`.as(
        "review_count",
      ),
    })
    .from(stores)
    .leftJoin(reviews, eq(reviews.storeId, stores.id))
    .where(and(...conditions))
    .groupBy(
      stores.id,
      stores.name,
      stores.category,
      stores.region,
      stores.address,
      stores.businessHours,
      stores.createdAt,
    )
    .orderBy(desc(stores.createdAt))
    .limit(opts.limit ?? 24);
}
