import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { stores } from "./stores";

/**
 * Plan v3 M3.4 — 외국인 손님이 찜한 매장 (mypage Saved 탭).
 *
 * composite PK (customer_id, store_id) — 한 손님이 같은 매장을 중복 저장 X.
 * 양쪽 FK ON DELETE CASCADE — 손님 또는 매장 삭제 시 자동 정리.
 */
export const customerSavedStores = pgTable(
  "customer_saved_stores",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.customerId, table.storeId] })],
);
