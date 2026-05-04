import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { customers } from "./customers";
import { stores } from "./stores";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").references(() => stores.id),
    customerId: uuid("customer_id").references(() => customers.id),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }),
    channel: text("channel"),
    direction: text("direction"),
    externalMessageId: text("external_message_id"),
    status: text("status"),
    originalText: text("original_text"),
    translatedText: text("translated_text"),
    languageFrom: text("language_from"),
    languageTo: text("language_to"),
    aiResponded: boolean("ai_responded").default(false),
    aiModel: text("ai_model"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "messages_direction_check",
      sql`${table.direction} IN ('inbound','outbound')`,
    ),
    index("idx_messages_conv_created").on(
      table.conversationId,
      table.createdAt.desc(),
    ),
    uniqueIndex("idx_messages_external_unique")
      .on(table.channel, table.externalMessageId)
      .where(sql`${table.externalMessageId} IS NOT NULL`),
  ],
);
