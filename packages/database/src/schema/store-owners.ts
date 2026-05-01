import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth/users";
import { stores } from "./stores";

export const storeOwners = pgTable(
  "store_owners",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.storeId] }),
    check("store_owners_role_check", sql`${table.role} IN ('owner','manager')`),
  ],
);
