import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  name: text("name").notNull(),
  languages: text("languages").array().default(["ko"]),
  portfolioUrls: text("portfolio_urls").array(),
  nonAsianWorks: boolean("non_asian_works").default(false),
});

export type Staff = (typeof staff)["$inferSelect"];
export type NewStaff = (typeof staff)["$inferInsert"];
