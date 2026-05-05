import "server-only";
import {
  and,
  eq,
  storeIntegrations,
  stores,
  type DbClient,
} from "@hesya/database";

type Channel = "instagram" | "whatsapp" | "kakao" | "line" | "messenger";

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
