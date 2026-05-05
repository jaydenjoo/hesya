import "server-only";
import {
  and,
  customers,
  eq,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Customer = typeof customers.$inferSelect;

export async function upsertCustomer(
  db: DbClient,
  input: {
    channel: Channel;
    externalId: string;
    preferredLanguage?: string;
  },
): Promise<Customer | null> {
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

  // race condition: insert와 select 사이에 row 삭제 → null 반환 (caller 결정)
  return existing[0] ?? null;
}
