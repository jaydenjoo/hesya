import "server-only";

import {
  and,
  apiPolicyAlerts,
  desc,
  eq,
  sql,
  type ApiPolicyAlert,
  type ApiPolicyAlertStatus,
  type DbClient,
  type NewApiPolicyAlert,
} from "@hesya/database";

/**
 * E12-8 API 정책 변경 알림 DAL (n8n RSS → hesya webhook 수신).
 *
 * unique(source, guid) 제약으로 중복 발송 차단. n8n 측 Static Data보다 안전 —
 * n8n 인스턴스 reset 시 휘발하지 않음. webhook receiver에서 충돌 시 idempotent
 * 동작 보장.
 *
 * admin은 status 큐로 처리 (new → reviewed/resolved/ignored).
 */

export interface InsertAlertInput {
  source: string;
  title: string;
  link: string;
  guid: string;
  pubDate?: Date | null;
}

export interface InsertAlertResult {
  alert: ApiPolicyAlert | null;
  inserted: boolean;
}

/**
 * 신규 alert 삽입 (idempotent).
 *
 * (source, guid) UNIQUE 위반 시 conflict skip — 동일 RSS entry가 n8n 재시도로
 * 두 번 들어와도 중복 row 생성 안 함. inserted=false로 호출자(webhook)가 응답
 * 코드 결정 (200 OK 그대로, Sentry 부재 등).
 */
export async function insertApiPolicyAlert(
  db: DbClient,
  input: InsertAlertInput,
): Promise<InsertAlertResult> {
  const row: NewApiPolicyAlert = {
    source: input.source,
    title: input.title,
    link: input.link,
    guid: input.guid,
    pubDate: input.pubDate ?? null,
  };

  const inserted = await db
    .insert(apiPolicyAlerts)
    .values(row)
    .onConflictDoNothing({
      target: [apiPolicyAlerts.source, apiPolicyAlerts.guid],
    })
    .returning();

  if (inserted[0]) {
    return { alert: inserted[0], inserted: true };
  }

  // 충돌(중복)이라 row가 안 나옴 — 기존 row 조회해서 반환
  const existing = await db
    .select({
      id: apiPolicyAlerts.id,
      source: apiPolicyAlerts.source,
      title: apiPolicyAlerts.title,
      link: apiPolicyAlerts.link,
      guid: apiPolicyAlerts.guid,
      pubDate: apiPolicyAlerts.pubDate,
      receivedAt: apiPolicyAlerts.receivedAt,
      status: apiPolicyAlerts.status,
      notes: apiPolicyAlerts.notes,
      reviewedByUserId: apiPolicyAlerts.reviewedByUserId,
      reviewedAt: apiPolicyAlerts.reviewedAt,
    })
    .from(apiPolicyAlerts)
    .where(
      and(
        eq(apiPolicyAlerts.source, input.source),
        eq(apiPolicyAlerts.guid, input.guid),
      ),
    )
    .limit(1);

  return { alert: existing[0] ?? null, inserted: false };
}

export interface ListAlertsFilter {
  status?: ApiPolicyAlertStatus;
}

export async function listAlertsForAdmin(
  db: DbClient,
  filter: ListAlertsFilter = {},
): Promise<ApiPolicyAlert[]> {
  const where = filter.status
    ? eq(apiPolicyAlerts.status, filter.status)
    : undefined;

  return db
    .select({
      id: apiPolicyAlerts.id,
      source: apiPolicyAlerts.source,
      title: apiPolicyAlerts.title,
      link: apiPolicyAlerts.link,
      guid: apiPolicyAlerts.guid,
      pubDate: apiPolicyAlerts.pubDate,
      receivedAt: apiPolicyAlerts.receivedAt,
      status: apiPolicyAlerts.status,
      notes: apiPolicyAlerts.notes,
      reviewedByUserId: apiPolicyAlerts.reviewedByUserId,
      reviewedAt: apiPolicyAlerts.reviewedAt,
    })
    .from(apiPolicyAlerts)
    .where(where)
    .orderBy(desc(apiPolicyAlerts.receivedAt));
}

/**
 * status 갱신 (admin 큐 처리). 본 PR은 DAL만 — UI에서 호출은 후속 PR.
 */
export async function updateAlertStatus(
  db: DbClient,
  input: {
    id: string;
    nextStatus: ApiPolicyAlertStatus;
    reviewerId: string;
    notes?: string;
  },
): Promise<ApiPolicyAlert | null> {
  const updated = await db
    .update(apiPolicyAlerts)
    .set({
      status: input.nextStatus,
      reviewedByUserId: input.reviewerId,
      reviewedAt: sql`now()`,
      notes: input.notes ?? null,
    })
    .where(eq(apiPolicyAlerts.id, input.id))
    .returning();

  return updated[0] ?? null;
}
