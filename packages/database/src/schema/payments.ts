import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  amountKrw: integer("amount_krw"),
  amountForeign: numeric("amount_foreign"),
  currencyForeign: text("currency_foreign"),
  exchangeRate: numeric("exchange_rate"),
  provider: text("provider"),
  providerTransactionId: text("provider_transaction_id"),
  status: text("status"),
  feeSaasKrw: integer("fee_saas_krw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
