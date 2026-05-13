import "server-only";
import {
  and,
  conversations,
  customers,
  desc,
  eq,
  inArray,
  sql,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Conversation = typeof conversations.$inferSelect;
type Status = "open" | "closed" | "snoozed";

/**
 * 인박스 thread list에서 사용. conversation row + `customers.name` 동봉으로
 * UI가 customer UUID 대신 이름 표시.
 */
export interface ConversationListItem extends Conversation {
  customerName: string | null;
}

export async function upsertConversation(
  db: DbClient,
  input: {
    storeId: string;
    customerId: string;
    channel: Channel;
    externalThreadId?: string;
  },
): Promise<Conversation> {
  const [row] = await db
    .insert(conversations)
    .values({
      storeId: input.storeId,
      customerId: input.customerId,
      channel: input.channel,
      externalThreadId: input.externalThreadId,
    })
    .onConflictDoUpdate({
      target: [
        conversations.storeId,
        conversations.customerId,
        conversations.channel,
      ],
      set: { updatedAt: new Date() },
    })
    .returning();
  if (!row) {
    throw new Error("upsertConversation: insert returned no row");
  }
  return row;
}

export async function getConversationById(
  db: DbClient,
  id: string,
): Promise<Conversation | null> {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listByStore(
  db: DbClient,
  storeId: string,
  opts: { status?: Status; limit?: number } = {},
): Promise<ConversationListItem[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.storeId, storeId),
        eq(conversations.status, opts.status ?? "open"),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(opts.limit ?? 50);

  if (rows.length === 0) return [];

  // customer.name 별도 fetch (join 대신 2 query — 50 row 한정이라 비용 미미,
  // 가독성 ↑). customer row 없으면 customerName=null 폴백.
  const customerIds = Array.from(new Set(rows.map((r) => r.customerId)));
  const customerRows = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(inArray(customers.id, customerIds));
  const nameMap = new Map(customerRows.map((c) => [c.id, c.name]));

  return rows.map((r) => ({
    ...r,
    customerName: nameMap.get(r.customerId) ?? null,
  }));
}

export async function incrementUnread(db: DbClient, id: string): Promise<void> {
  await db
    .update(conversations)
    .set({
      unreadCount: sql`${conversations.unreadCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}

export async function markAllRead(db: DbClient, id: string): Promise<void> {
  await db
    .update(conversations)
    .set({ unreadCount: 0, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function updateLastMessage(
  db: DbClient,
  id: string,
  data: { preview: string; at: Date },
): Promise<void> {
  await db
    .update(conversations)
    .set({
      lastMessagePreview: data.preview,
      lastMessageAt: data.at,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}

export async function setMessagingWindow(
  db: DbClient,
  id: string,
  lastInboundAt: Date,
): Promise<void> {
  const expires = new Date(lastInboundAt.getTime() + 24 * 60 * 60 * 1000);
  await db
    .update(conversations)
    .set({
      lastInboundAt,
      messagingWindowExpiresAt: expires,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}
