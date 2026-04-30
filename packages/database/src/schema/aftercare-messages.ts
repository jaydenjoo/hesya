import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

export const aftercareMessages = pgTable("aftercare_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  sendAt: timestamp("send_at", { withTimezone: true }),
  status: text("status"),
  template: text("template"),
  content: text("content"),
});
