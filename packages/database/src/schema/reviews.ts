import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { customers } from "./customers";
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
  /** M3.4 — 손님 직접 작성 리뷰의 customer FK. 외부 fetch row는 NULL. */
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  /** M3.4 — 손님 작성 리뷰가 어떤 booking에 대한 것인지. 외부 fetch row는 NULL. */
  bookingId: uuid("booking_id").references(() => bookings.id, {
    onDelete: "set null",
  }),
});
