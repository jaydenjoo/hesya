import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Better Auth users + Epic 12-α admin role 컬럼.
 *
 * `role` 도입 의도 (2026-05-16, 마이그 0030):
 *  - 기존 `ADMIN_EMAILS` env 화이트리스트는 첫 운영자 1~2명용 임시 솔루션.
 *  - role 컬럼으로 운영자/일반 사용자 구분을 DB single source of truth로 이전.
 *  - 이 PR은 foundational only — `requireAdminEmail` 22 call sites는 그대로 유지.
 *    `requireAdminRole` 새 guard가 추가되며 점진 migrate 예정 (Phase 1-γ.2+).
 *
 * Enum: 'user' (default) | 'admin'. super_admin·moderator 등은 YAGNI.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("users_role_check", sql`${table.role} IN ('user','admin')`),
  ],
);
