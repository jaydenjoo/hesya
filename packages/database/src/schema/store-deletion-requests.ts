/**
 * Epic 12.9 — 매장 해지·데이터 삭제 (PRD §1068, SLA 30일 grace).
 *
 * 매장 owner 자가해지 또는 admin 강제해지 → 30일 grace → cron이 cascade purge.
 * 같은 매장에 활성 요청은 1개만 (partial unique index, app layer에서도 검증).
 * source: owner=자가해지, admin=강제해지(약관 위반 등). 컬럼 컨벤션은 0022~0024 패턴 따름.
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { stores } from "./stores";

export const storeDeletionRequests = pgTable("store_deletion_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  requestedByEmail: text("requested_by_email").notNull(),
  requestedByUserId: uuid("requested_by_user_id"),
  reason: text("reason"),
  scheduledPurgeAt: timestamp("scheduled_purge_at", {
    withTimezone: true,
  }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledByEmail: text("cancelled_by_email"),
  purgedAt: timestamp("purged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const STORE_DELETION_SOURCES = ["owner", "admin"] as const;
export type StoreDeletionSource = (typeof STORE_DELETION_SOURCES)[number];

export type StoreDeletionRequest = typeof storeDeletionRequests.$inferSelect;
export type NewStoreDeletionRequest = typeof storeDeletionRequests.$inferInsert;

export const STORE_DELETION_GRACE_DAYS = 30;
