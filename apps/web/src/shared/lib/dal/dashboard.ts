import "server-only";

import {
  and,
  conversations,
  count,
  disputes,
  eq,
  inArray,
  stores,
  sum,
  type DbClient,
} from "@hesya/database";

/**
 * Epic 4 (ε phase) — 매장 운영 대시보드 DAL.
 *
 * **현 시점 측정 가능 KPI만 함수 정의** (Epic 2/3 미구현):
 * - 미응답 인박스 합계 (E1, conversations.unread_count sum)
 * - 진행 중 분쟁 건수 (E12-4, disputes.status IN open/in_review)
 * - 매장 KYC 검증 상태 (E9, stores.verification_status)
 *
 * 나머지 9개 KPI (재방문률 / 매출 / 객단가 / 노쇼율 / NPS / 국적 분포 / 시술
 * 분포 / 디자이너 분포 / 결제 미수)는 Epic 2/3 (payments / bookings) 도입 후
 * 별 phase에서 추가.
 */

export interface InboxLoadSummary {
  /** 매장의 모든 conversation unread_count 합 (전체 미응답 메시지 수) */
  unreadMessages: number;
  /** open status 대화 thread 수 */
  openThreads: number;
}

export async function getInboxLoad(
  db: DbClient,
  storeId: string,
): Promise<InboxLoadSummary> {
  const [unreadRow] = await db
    .select({
      unread: sum(conversations.unreadCount).mapWith(Number),
      threads: count(conversations.id).mapWith(Number),
    })
    .from(conversations)
    .where(
      and(eq(conversations.storeId, storeId), eq(conversations.status, "open")),
    );

  return {
    unreadMessages: unreadRow?.unread ?? 0,
    openThreads: unreadRow?.threads ?? 0,
  };
}

export interface DisputeLoadSummary {
  /** open + in_review 합 — 매장 측 처리 필요 */
  active: number;
  /** sla_exceeded — 운영자 개입 임박 */
  slaExceeded: number;
}

export async function getDisputeLoad(
  db: DbClient,
  storeId: string,
): Promise<DisputeLoadSummary> {
  const [activeRow] = await db
    .select({ n: count(disputes.id).mapWith(Number) })
    .from(disputes)
    .where(
      and(
        eq(disputes.storeId, storeId),
        inArray(disputes.status, ["open", "in_review"]),
      ),
    );

  const [slaRow] = await db
    .select({ n: count(disputes.id).mapWith(Number) })
    .from(disputes)
    .where(
      and(eq(disputes.storeId, storeId), eq(disputes.status, "sla_exceeded")),
    );

  return {
    active: activeRow?.n ?? 0,
    slaExceeded: slaRow?.n ?? 0,
  };
}

/**
 * 이번 달 시작/끝 — Asia/Seoul 기준. dashboard 기간 필터의 1차 stub
 * (week/quarter는 별 PR).
 */
export function getCurrentMonthRange(now = new Date()): {
  fromDate: Date;
  toDate: Date;
} {
  const fromDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
  );
  const toDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
  );
  return { fromDate, toDate };
}

export type KycVerificationStatus =
  | "pending"
  | "auto_approved"
  | "manual_review"
  | "rejected"
  | "unknown";

export async function getKycStatus(
  db: DbClient,
  storeId: string,
): Promise<KycVerificationStatus> {
  const [row] = await db
    .select({ status: stores.verificationStatus })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  const raw = row?.status ?? null;
  if (
    raw === "pending" ||
    raw === "auto_approved" ||
    raw === "manual_review" ||
    raw === "rejected"
  ) {
    return raw;
  }
  return "unknown";
}
