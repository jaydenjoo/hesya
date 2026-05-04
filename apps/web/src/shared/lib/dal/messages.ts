import "server-only";
import { and, asc, eq, messages, type DbClient } from "@hesya/database";

type Message = typeof messages.$inferSelect;
type Channel = "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
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
): Promise<Message> {
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

  if (!input.externalMessageId) {
    throw new Error(
      "insertMessage: insert returned no row and no externalMessageId for conflict lookup",
    );
  }

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

  if (!existing[0]) {
    throw new Error(
      `insertMessage: conflict on (${input.channel}, ${input.externalMessageId}) but row not found`,
    );
  }
  return existing[0];
}

export async function listByConversation(
  db: DbClient,
  conversationId: string,
  opts: { limit?: number } = {},
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(opts.limit ?? 200);
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
