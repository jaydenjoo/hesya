/**
 * Epic 12.8 — API 정책 변경 알림 (PRD §1063, SLA 7일).
 *
 * n8n RSS Feed Read 워크플로가 30분마다 Meta/WhatsApp 등 RSS를 폴링 →
 * 새 entry를 hesya webhook으로 POST → 본 테이블에 unique(source, guid)로
 * 중복 차단하며 저장. admin이 큐에서 검토 → status 갱신.
 *
 * R1 완화 인프라: 5채널 분산이 근본 완화이고, 본 알림은 변경 조기 감지.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const apiPolicyAlerts = pgTable(
  "api_policy_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    guid: text("guid").notNull(),
    pubDate: timestamp("pub_date", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text("status").notNull().default("new"),
    notes: text("notes"),
    reviewedByUserId: uuid("reviewed_by_user_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    unique("api_policy_alerts_source_guid_unique").on(table.source, table.guid),
    index("api_policy_alerts_status_received_idx").on(
      table.status,
      table.receivedAt.desc(),
    ),
    index("api_policy_alerts_source_idx").on(table.source),
    // SQL 마이그(0024)의 CHECK와 일치 — Drizzle Studio / 직접 쿼리 시 동일 제약.
    check(
      "api_policy_alerts_status_check",
      sql`${table.status} IN ('new', 'reviewed', 'resolved', 'ignored')`,
    ),
  ],
);

export const API_POLICY_ALERT_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "ignored",
] as const;
export type ApiPolicyAlertStatus = (typeof API_POLICY_ALERT_STATUSES)[number];

export type ApiPolicyAlert = typeof apiPolicyAlerts.$inferSelect;
export type NewApiPolicyAlert = typeof apiPolicyAlerts.$inferInsert;
