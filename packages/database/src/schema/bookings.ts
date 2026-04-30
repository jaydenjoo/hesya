import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { services } from "./services";
import { staff } from "./staff";
import { stores } from "./stores";

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  customerId: uuid("customer_id").references(() => customers.id),
  staffId: uuid("staff_id").references(() => staff.id),
  serviceId: uuid("service_id").references(() => services.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status"),
  totalPriceKrw: integer("total_price_krw"),
  depositPaidKrw: integer("deposit_paid_krw"),
  paymentMethod: text("payment_method"),
  notesMultilang: jsonb("notes_multilang"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
