import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { stores } from "./stores";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").references(() => stores.id),
    customerId: uuid("customer_id").references(() => customers.id),
    channel: text("channel"),
    direction: text("direction"),
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
  ],
);
