import "server-only";
import {
  and,
  eq,
  storeIntegrations,
  type Channel,
  type DbClient,
} from "@hesya/database";
import { decryptToken, encryptToken } from "./pgsodium-helpers";

export interface StoreIntegration {
  externalAccountId: string;
  externalPageId: string | null;
  externalAccountName: string | null;
  accessToken: string;
  tokenExpiresAt: Date | null;
  scopes: string[] | null;
  webhookSubscribedAt: Date | null;
}

export async function upsertIntegration(
  db: DbClient,
  input: {
    storeId: string;
    channel: Channel;
    externalAccountId: string;
    externalPageId?: string;
    externalAccountName?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date | null;
    scopes?: string[];
  },
): Promise<void> {
  const accessTokenEncrypted = await encryptToken(db, input.accessToken);
  const refreshTokenEncrypted = input.refreshToken
    ? await encryptToken(db, input.refreshToken)
    : null;

  await db
    .insert(storeIntegrations)
    .values({
      storeId: input.storeId,
      channel: input.channel,
      externalAccountId: input.externalAccountId,
      externalPageId: input.externalPageId,
      externalAccountName: input.externalAccountName,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
    })
    .onConflictDoUpdate({
      target: [storeIntegrations.storeId, storeIntegrations.channel],
      set: {
        externalAccountId: input.externalAccountId,
        externalAccountName: input.externalAccountName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: input.tokenExpiresAt ?? null,
        scopes: input.scopes,
        updatedAt: new Date(),
      },
    });
}

export async function getIntegration(
  db: DbClient,
  storeId: string,
  channel: Channel,
): Promise<StoreIntegration | null> {
  const rows = await db
    .select()
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.channel, channel),
      ),
    )
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];

  const accessToken = await decryptToken(
    db,
    Buffer.from(row.accessTokenEncrypted),
  );

  return {
    externalAccountId: row.externalAccountId,
    externalPageId: row.externalPageId,
    externalAccountName: row.externalAccountName,
    accessToken,
    tokenExpiresAt: row.tokenExpiresAt,
    scopes: row.scopes,
    webhookSubscribedAt: row.webhookSubscribedAt,
  };
}

export async function markWebhookSubscribed(
  db: DbClient,
  storeId: string,
  channel: Channel,
): Promise<void> {
  await db
    .update(storeIntegrations)
    .set({ webhookSubscribedAt: new Date() })
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.channel, channel),
      ),
    );
}
