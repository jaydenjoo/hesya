import { sql } from "drizzle-orm";
import {
  check,
  customType,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const storeIntegrations = pgTable(
  "store_integrations",
  {
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),

    externalAccountId: text("external_account_id").notNull(),
    externalPageId: text("external_page_id"),
    externalAccountName: text("external_account_name"),

    accessTokenEncrypted: bytea("access_token_encrypted").notNull(),
    refreshTokenEncrypted: bytea("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),

    scopes: text("scopes").array(),
    webhookSubscribedAt: timestamp("webhook_subscribed_at", {
      withTimezone: true,
    }),

    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.storeId, table.channel] }),
    check(
      "store_integrations_channel_check",
      sql`${table.channel} IN ('instagram','whatsapp','kakao','line','messenger')`,
    ),
  ],
);
