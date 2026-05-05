import "server-only";
import {
  and,
  conversations,
  desc,
  eq,
  sql,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Conversation = typeof conversations.$inferSelect;
type Status = "open" | "closed" | "snoozed";

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
): Promise<Conversation[]> {
  return db
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
