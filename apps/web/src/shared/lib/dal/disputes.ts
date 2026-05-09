import "server-only";

import {
  and,
  desc,
  disputes,
  eq,
  type DbClient,
  type Dispute,
  type DisputeCategory,
  type DisputeStatus,
  type NewDispute,
} from "@hesya/database";

/**
 * SLA 계산 — 5영업일 (월~금, 공휴일 무시: 베타 MVP, PRD §1063).
 *
 * 한국 공휴일은 다음 phase에서 data.go.kr API 연동 (Plan-v2-scenario-B Q3 결정).
 */
export function computeSlaDueAt(start: Date, businessDays = 5): Date {
  const date = new Date(start.getTime());
  let added = 0;
  while (added < businessDays) {
    date.setUTCDate(date.getUTCDate() + 1);
    const dow = date.getUTCDay(); // 0=Sun, 6=Sat
    if (dow >= 1 && dow <= 5) added += 1;
  }
  return date;
}

export interface CreateDisputeInput {
  storeId: string;
  conversationId?: string | null;
  filedByUserId: string;
  category: DisputeCategory;
  description: string;
}

export async function createDispute(
  db: DbClient,
  input: CreateDisputeInput,
): Promise<Dispute> {
  const now = new Date();
  const row: NewDispute = {
    storeId: input.storeId,
    conversationId: input.conversationId ?? null,
    filedByUserId: input.filedByUserId,
    category: input.category,
    description: input.description,
    slaDueAt: computeSlaDueAt(now),
  };
  const inserted = await db.insert(disputes).values(row).returning();
  if (!inserted[0]) {
    throw new Error("disputes insert returned 0 rows");
  }
  return inserted[0];
}

export async function getDispute(
  db: DbClient,
  id: string,
): Promise<Dispute | null> {
  const rows = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listDisputesForAdmin(
  db: DbClient,
  filter: { status?: DisputeStatus } = {},
): Promise<Dispute[]> {
  const where = filter.status ? eq(disputes.status, filter.status) : undefined;
  return db
    .select()
    .from(disputes)
    .where(where)
    .orderBy(desc(disputes.createdAt));
}

export async function listDisputesByStore(
  db: DbClient,
  storeId: string,
): Promise<Dispute[]> {
  return db
    .select()
    .from(disputes)
    .where(eq(disputes.storeId, storeId))
    .orderBy(desc(disputes.createdAt));
}

export interface UpdateDisputeStatusInput {
  status: Extract<DisputeStatus, "in_review" | "resolved" | "rejected">;
  resolution?: string;
  resolvedByUserId: string;
}

export async function updateDisputeStatus(
  db: DbClient,
  id: string,
  input: UpdateDisputeStatusInput,
): Promise<Dispute | null> {
  const isTerminal = input.status === "resolved" || input.status === "rejected";
  const now = new Date();
  const updated = await db
    .update(disputes)
    .set({
      status: input.status,
      resolution: input.resolution ?? null,
      resolvedByUserId: input.resolvedByUserId,
      updatedAt: now,
      resolvedAt: isTerminal ? now : null,
    })
    .where(and(eq(disputes.id, id), eq(disputes.status, "open")))
    .returning();

  if (updated[0]) return updated[0];

  // open → in_review 이미 전이된 케이스: in_review에서 resolved/rejected 허용
  if (input.status !== "in_review") {
    const fromInReview = await db
      .update(disputes)
      .set({
        status: input.status,
        resolution: input.resolution ?? null,
        resolvedByUserId: input.resolvedByUserId,
        updatedAt: now,
        resolvedAt: now,
      })
      .where(and(eq(disputes.id, id), eq(disputes.status, "in_review")))
      .returning();
    return fromInReview[0] ?? null;
  }

  return null;
}
