import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  lte,
  sql,
  storeDeletionRequests,
  stores,
  STORE_DELETION_GRACE_DAYS,
  type DbClient,
  type StoreDeletionRequest,
  type StoreDeletionSource,
} from "@hesya/database";

/**
 * E12-9 매장 해지·데이터 삭제 DAL (PRD §1068, SLA 30일 grace, PIPA §21).
 *
 * 흐름:
 *   1. requestDeletion → stores.deletedAt = now, store_deletion_requests INSERT
 *      (scheduledPurgeAt = now + 30d). 부분 unique 인덱스가 활성 요청 1개만 보장.
 *   2. cancelDeletion → stores.deletedAt = NULL, store_deletion_requests.cancelledAt
 *      = now. owner 또는 admin이 grace 중 호출 가능.
 *   3. purgeExpired (cron) → scheduled_purge_at <= now AND not cancelled/purged
 *      행을 트랜잭션 내에서 store CASCADE delete + request.purgedAt = now.
 *      stores → 모든 비즈니스 데이터 (FK ON DELETE CASCADE) hard-delete.
 *
 * source: 'owner' (자가해지) | 'admin' (강제해지, 약관 위반 등). 두 경로 모두
 * 30일 grace 동일 — admin 즉시 hard-delete 원하면 별도 액션.
 */

export interface RequestDeletionInput {
  storeId: string;
  source: StoreDeletionSource;
  requestedByEmail: string;
  requestedByUserId?: string | null;
  reason?: string | null;
  now?: Date;
  graceDays?: number;
}

export interface CancelDeletionInput {
  storeId: string;
  cancelledByEmail: string;
  now?: Date;
}

export interface PurgeExpiredInput {
  now?: Date;
  limit?: number;
}

export interface PurgeExpiredResult {
  purgedStoreIds: string[];
  failedStoreIds: string[];
}

export interface ListDeletionRequestsFilter {
  status?: "pending" | "expired" | "cancelled" | "purged" | "all";
}

export interface DeletionRequestRow extends StoreDeletionRequest {
  storeName: string;
}

export class StoreDeletionConflictError extends Error {
  constructor(message = "store deletion already pending") {
    super(message);
    this.name = "StoreDeletionConflictError";
  }
}

export class StoreDeletionNotFoundError extends Error {
  constructor(storeId: string) {
    super(`store ${storeId} not found`);
    this.name = "StoreDeletionNotFoundError";
  }
}

function computeScheduledPurgeAt(now: Date, graceDays: number): Date {
  const result = new Date(now.getTime());
  result.setUTCDate(result.getUTCDate() + graceDays);
  return result;
}

export async function requestStoreDeletion(
  db: DbClient,
  input: RequestDeletionInput,
): Promise<StoreDeletionRequest> {
  const now = input.now ?? new Date();
  const graceDays = input.graceDays ?? STORE_DELETION_GRACE_DAYS;
  const scheduledPurgeAt = computeScheduledPurgeAt(now, graceDays);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: storeDeletionRequests.id })
      .from(storeDeletionRequests)
      .where(
        and(
          eq(storeDeletionRequests.storeId, input.storeId),
          isNull(storeDeletionRequests.cancelledAt),
          isNull(storeDeletionRequests.purgedAt),
        ),
      )
      .limit(1);

    if (existing[0]) {
      throw new StoreDeletionConflictError();
    }

    const updatedStore = await tx
      .update(stores)
      .set({
        deletedAt: now,
        deletionReason: input.reason ?? null,
      })
      .where(eq(stores.id, input.storeId))
      .returning({ id: stores.id });

    if (!updatedStore[0]) {
      throw new StoreDeletionNotFoundError(input.storeId);
    }

    const inserted = await tx
      .insert(storeDeletionRequests)
      .values({
        storeId: input.storeId,
        source: input.source,
        requestedByEmail: input.requestedByEmail,
        requestedByUserId: input.requestedByUserId ?? null,
        reason: input.reason ?? null,
        scheduledPurgeAt,
      })
      .returning();

    if (!inserted[0]) {
      throw new Error("store_deletion_requests insert returned 0 rows");
    }
    return inserted[0];
  });
}

export async function cancelStoreDeletion(
  db: DbClient,
  input: CancelDeletionInput,
): Promise<StoreDeletionRequest | null> {
  const now = input.now ?? new Date();

  return db.transaction(async (tx) => {
    const active = await tx
      .select()
      .from(storeDeletionRequests)
      .where(
        and(
          eq(storeDeletionRequests.storeId, input.storeId),
          isNull(storeDeletionRequests.cancelledAt),
          isNull(storeDeletionRequests.purgedAt),
        ),
      )
      .limit(1);

    if (!active[0]) {
      return null;
    }

    await tx
      .update(stores)
      .set({ deletedAt: null, deletionReason: null })
      .where(eq(stores.id, input.storeId));

    const updated = await tx
      .update(storeDeletionRequests)
      .set({
        cancelledAt: now,
        cancelledByEmail: input.cancelledByEmail,
      })
      .where(eq(storeDeletionRequests.id, active[0].id))
      .returning();

    return updated[0] ?? null;
  });
}

export async function getActiveDeletionRequest(
  db: DbClient,
  storeId: string,
): Promise<StoreDeletionRequest | null> {
  const rows = await db
    .select()
    .from(storeDeletionRequests)
    .where(
      and(
        eq(storeDeletionRequests.storeId, storeId),
        isNull(storeDeletionRequests.cancelledAt),
        isNull(storeDeletionRequests.purgedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listDeletionRequestsForAdmin(
  db: DbClient,
  filter: ListDeletionRequestsFilter = {},
): Promise<DeletionRequestRow[]> {
  const status = filter.status ?? "all";
  const now = new Date();

  const conditions = [];
  if (status === "pending") {
    conditions.push(
      isNull(storeDeletionRequests.cancelledAt),
      isNull(storeDeletionRequests.purgedAt),
      sql`${storeDeletionRequests.scheduledPurgeAt} > ${now}`,
    );
  } else if (status === "expired") {
    conditions.push(
      isNull(storeDeletionRequests.cancelledAt),
      isNull(storeDeletionRequests.purgedAt),
      lte(storeDeletionRequests.scheduledPurgeAt, now),
    );
  } else if (status === "cancelled") {
    conditions.push(isNotNull(storeDeletionRequests.cancelledAt));
  } else if (status === "purged") {
    conditions.push(isNotNull(storeDeletionRequests.purgedAt));
  }

  return db
    .select({
      id: storeDeletionRequests.id,
      storeId: storeDeletionRequests.storeId,
      source: storeDeletionRequests.source,
      requestedByEmail: storeDeletionRequests.requestedByEmail,
      requestedByUserId: storeDeletionRequests.requestedByUserId,
      reason: storeDeletionRequests.reason,
      scheduledPurgeAt: storeDeletionRequests.scheduledPurgeAt,
      cancelledAt: storeDeletionRequests.cancelledAt,
      cancelledByEmail: storeDeletionRequests.cancelledByEmail,
      purgedAt: storeDeletionRequests.purgedAt,
      createdAt: storeDeletionRequests.createdAt,
      storeName: stores.name,
    })
    .from(storeDeletionRequests)
    .innerJoin(stores, eq(storeDeletionRequests.storeId, stores.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(storeDeletionRequests.createdAt));
}

/**
 * 30일 경과 + cancelled/purged 아닌 요청을 cascade hard-delete.
 *
 * stores DELETE → FK CASCADE로 customers/conversations/messages/services/staff/
 * store_owners/store_integrations/store_knowledge/store_verifications/
 * store_reports/store_tone_examples/disputes/payments/bookings/reviews/
 * kyc_verification_logs/aftercare_messages 모두 hard-delete.
 *
 * api_policy_alerts는 매장 무관 (글로벌) → 영향 없음.
 *
 * 트랜잭션으로 1매장씩 처리. 도중 실패 시 해당 매장만 rollback, 다음 매장 계속.
 *
 * limit: 한 cron tick 처리량 (default 50). Vercel Function timeout 보호.
 */
export async function purgeExpiredStoreDeletions(
  db: DbClient,
  input: PurgeExpiredInput = {},
): Promise<PurgeExpiredResult> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 50;

  const expired = await db
    .select({
      id: storeDeletionRequests.id,
      storeId: storeDeletionRequests.storeId,
    })
    .from(storeDeletionRequests)
    .where(
      and(
        isNull(storeDeletionRequests.cancelledAt),
        isNull(storeDeletionRequests.purgedAt),
        lte(storeDeletionRequests.scheduledPurgeAt, now),
      ),
    )
    .orderBy(asc(storeDeletionRequests.scheduledPurgeAt))
    .limit(limit);

  const purgedStoreIds: string[] = [];
  const failedStoreIds: string[] = [];

  for (const row of expired) {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(stores).where(eq(stores.id, row.storeId));
        await tx
          .update(storeDeletionRequests)
          .set({ purgedAt: now })
          .where(eq(storeDeletionRequests.id, row.id));
      });
      purgedStoreIds.push(row.storeId);
    } catch (err) {
      // 한 매장 실패해도 다음 매장 계속 (DAL 주석의 "도중 실패 시 다음 매장 계속"
      // 의도 보장). 실패 storeId는 별도 수집해 cron 응답에 카운트 노출.
      console.error(
        `[purgeExpiredStoreDeletions] failed for storeId=${row.storeId}:`,
        err,
      );
      failedStoreIds.push(row.storeId);
    }
  }

  return { purgedStoreIds, failedStoreIds };
}
