import "server-only";
import {
  and,
  asc,
  eq,
  messages,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Message = typeof messages.$inferSelect;
type Direction = "inbound" | "outbound";

export async function insertMessage(
  db: DbClient,
  input: {
    conversationId: string;
    channel: Channel;
    direction: Direction;
    originalText: string;
    externalMessageId?: string;
    status?: string;
  },
): Promise<Message | null> {
  const defaultStatus =
    input.status ?? (input.direction === "outbound" ? "sent" : null);

  const inserted = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      channel: input.channel,
      direction: input.direction,
      originalText: input.originalText,
      externalMessageId: input.externalMessageId,
      status: defaultStatus,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  // conflict 발생 — externalMessageId 없으면 조회 불가, null 반환 (caller가 처리)
  if (!input.externalMessageId) return null;

  const existing = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.channel, input.channel),
        eq(messages.externalMessageId, input.externalMessageId),
      ),
    )
    .limit(1);

  // race condition: insert와 select 사이에 row 삭제 → null 반환 (caller 결정)
  return existing[0] ?? null;
}

export async function listByConversation(
  db: DbClient,
  conversationId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(opts.limit ?? 200)
    .offset(opts.offset ?? 0);
}

export async function markFailed(
  db: DbClient,
  messageId: string,
): Promise<void> {
  await db
    .update(messages)
    .set({ status: "failed" })
    .where(eq(messages.id, messageId));
}
