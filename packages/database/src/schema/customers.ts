import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id"),
  channel: text("channel"),
  nationality: text("nationality"),
  preferredLanguage: text("preferred_language"),
  paymentMethodPreferred: text("payment_method_preferred"),
  totalVisits: integer("total_visits").default(0),
  ltvKrw: integer("ltv_krw").default(0),
});
