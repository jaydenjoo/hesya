import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { stores } from "./stores";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    channel: text("channel").notNull(),
    externalThreadId: text("external_thread_id"),
    status: text("status").notNull().default("open"),

    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    messagingWindowExpiresAt: timestamp("messaging_window_expires_at", {
      withTimezone: true,
    }),

    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("conversations_store_customer_channel_unique").on(
      table.storeId,
      table.customerId,
      table.channel,
    ),
    check(
      "conversations_channel_check",
      sql`${table.channel} IN ('instagram','whatsapp','kakao','line','messenger')`,
    ),
    check(
      "conversations_status_check",
      sql`${table.status} IN ('open','closed','snoozed')`,
    ),
    index("idx_conversations_store_lastmsg").on(
      table.storeId,
      table.status,
      table.lastMessageAt.desc(),
    ),
    index("idx_conversations_window")
      .on(table.messagingWindowExpiresAt)
      .where(sql`${table.messagingWindowExpiresAt} IS NOT NULL`),
  ],
);
