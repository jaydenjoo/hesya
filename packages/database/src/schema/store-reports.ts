import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const storeReports = pgTable("store_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  reporterType: text("reporter_type"),
  reportReason: text("report_reason"),
  description: text("description"),
  evidenceUrls: text("evidence_urls").array(),
  status: text("status").default("pending"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
