import "server-only";
import { and, customers, eq, type DbClient } from "@hesya/database";

type Customer = typeof customers.$inferSelect;
type Channel = "instagram" | "whatsapp" | "kakao" | "line" | "messenger";

export async function upsertCustomer(
  db: DbClient,
  input: {
    channel: Channel;
    externalId: string;
    preferredLanguage?: string;
  },
): Promise<Customer> {
  const inserted = await db
    .insert(customers)
    .values({
      channel: input.channel,
      externalId: input.externalId,
      preferredLanguage: input.preferredLanguage,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.channel, input.channel),
        eq(customers.externalId, input.externalId),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error(
      `upsertCustomer: insert returned no row and lookup failed for (${input.channel}, ${input.externalId})`,
    );
  }
  return existing[0];
}
