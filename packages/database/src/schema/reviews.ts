import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  source: text("source"),
  sourceReviewId: text("source_review_id"),
  rating: integer("rating"),
  content: text("content"),
  language: text("language"),
  sentiment: text("sentiment"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
});
