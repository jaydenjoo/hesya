import "server-only";
import {
  conversations,
  customers,
  messages,
  stores,
  type DbClient,
} from "@hesya/database";

/**
 * 통합 테스트 격리용 DB 헬퍼.
 *
 * Phase B vault helper와 동일한 패턴으로 `db: DbClient`를 인자로 받음
 * (env.ts 로드 디커플 → 단위 테스트 CI 안전).
 *
 * 호출 측에서 `process.env.HESYA_TEST_DATABASE_URL`로 만든 db만
 * 주입해야 함. prod DATABASE_URL을 넘기면 데이터 손실. 테스트 파일에서
 * `describe.skipIf(!hasDb)` 게이트 필수.
 */

export async function resetDb(db: DbClient): Promise<void> {
  // FK 의존: messages → conversations → customers/stores
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(customers);
  await db.delete(stores);
}

export async function seedStore(
  db: DbClient,
  overrides: { name?: string } = {},
): Promise<string> {
  const [row] = await db
    .insert(stores)
    .values({ name: overrides.name ?? "Test Store" })
    .returning({ id: stores.id });
  if (!row) throw new Error("seedStore: insert returned no row");
  return row.id;
}

export async function seedCustomer(
  db: DbClient,
  input: { channel: string; externalId: string },
): Promise<string> {
  const [row] = await db
    .insert(customers)
    .values({ channel: input.channel, externalId: input.externalId })
    .returning({ id: customers.id });
  if (!row) throw new Error("seedCustomer: insert returned no row");
  return row.id;
}
