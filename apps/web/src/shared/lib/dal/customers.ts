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

export async function getExternalIdByCustomerId(
  db: DbClient,
  customerId: string,
): Promise<string | null> {
  const rows = await db
    .select({ externalId: customers.externalId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0]?.externalId ?? null;
}

/**
 * customerId로 `preferred_language` 단건 조회. Phase B-2 AI 응답 언어 결정에 사용.
 * - 미설정(null)이면 caller가 fallback 언어 결정 (보통 "ko").
 * - DB 컬럼은 임의 text — 5개 enum 매핑은 caller 책임.
 */
export async function getCustomerPreferredLanguage(
  db: DbClient,
  customerId: string,
): Promise<string | null> {
  const rows = await db
    .select({ preferredLanguage: customers.preferredLanguage })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0]?.preferredLanguage ?? null;
}
