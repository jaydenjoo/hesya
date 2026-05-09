/**
 * Epic 12.4 — 분쟁 처리 큐 (PRD §1063, SLA 5영업일).
 *
 * 사장이 신고 → admin 검토 → 해결/거절 흐름. 컬럼 컨벤션은 0022 패턴 따름
 * (FK 없는 user_id는 RLS-flexible — Better Auth users.id를 application layer
 * 검증).
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { stores } from "./stores";

export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),
  filedByUserId: uuid("filed_by_user_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedByUserId: uuid("resolved_by_user_id"),
  slaDueAt: timestamp("sla_due_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const DISPUTE_CATEGORIES = ["no_show", "refund", "complaint"] as const;
export type DisputeCategory = (typeof DISPUTE_CATEGORIES)[number];

export const DISPUTE_STATUSES = [
  "open",
  "in_review",
  "resolved",
  "rejected",
  "sla_exceeded",
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export type Dispute = typeof disputes.$inferSelect;
export type NewDispute = typeof disputes.$inferInsert;
