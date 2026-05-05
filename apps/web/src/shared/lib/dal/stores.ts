import "server-only";
import {
  and,
  conversations,
  eq,
  storeIntegrations,
  stores,
  type Channel,
  type DbClient,
} from "@hesya/database";

/**
 * 외부 채널 계정 ID로 매장 1건 조회.
 *
 * Instagram webhook이 도착하면 `entry.id` (= IG 비즈니스 계정 ID)로 매장을
 * 라우팅한다. 미연결 매장의 webhook은 무시 (caller가 continue).
 */
export async function findStoreByExternalAccount(
  db: DbClient,
  input: {
    channel: Channel;
    externalAccountId: string;
  },
): Promise<{ id: string } | null> {
  const rows = await db
    .select({ id: stores.id })
    .from(stores)
    .innerJoin(storeIntegrations, eq(storeIntegrations.storeId, stores.id))
    .where(
      and(
        eq(storeIntegrations.channel, input.channel),
        eq(storeIntegrations.externalAccountId, input.externalAccountId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * conversationId로 매장 이름(`stores.name`)만 조회. Phase B-2 AI 트리거가
 * `buildPrompt` 입력의 `storeName`을 채우기 위해 사용.
 *
 * - conversation 없거나 store join 실패 시 `null`. Caller가 안전 종료 결정.
 * - 필요한 컬럼만 `select` (CLAUDE.md: `select('*')` 금지).
 */
export async function findStoreNameByConversationId(
  db: DbClient,
  conversationId: string,
): Promise<string | null> {
  const rows = await db
    .select({ name: stores.name })
    .from(stores)
    .innerJoin(conversations, eq(conversations.storeId, stores.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  return rows[0]?.name ?? null;
}
