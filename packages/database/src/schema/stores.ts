import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Plan v3 M3.3 — 매장 영업시간. 요일별 open/close (HH:mm 24h) 또는 null (휴무).
 * 예: `{ mon: {open: "10:00", close: "20:00"}, sun: null }`.
 */
export type BusinessHours = Partial<
  Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    { open: string; close: string } | null
  >
>;

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category"),
    region: text("region"),
    address: jsonb("address"),
    phone: text("phone"),
    businessLicenseNumber: text("business_license_number"),
    businessLicenseImageUrl: text("business_license_image_url"),
    taxRefundRegistered: boolean("tax_refund_registered").default(false),
    verificationStatus: text("verification_status"),
    botMode: boolean("bot_mode").notNull().default(false),
    /**
     * Plan v3 M3.3 (마이그 0026) — 요일별 영업시간. M2.3 customer schedule UI가
     * 매장별 hours를 표시하기 위해. null/누락 = "10:00~20:00 기본값 사용".
     */
    businessHours: jsonb("business_hours").$type<BusinessHours>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletionReason: text("deletion_reason"),
  },
  (table) => [
    check(
      "stores_category_check",
      sql`${table.category} IN ('hair_general','skin_beauty','nail','makeup','composite','free_personal_color','free_makeup_class','free_hanbok','free_kpop_class')`,
    ),
    check(
      "stores_verification_status_check",
      sql`${table.verificationStatus} IN ('pending','auto_approved','manual_review','rejected')`,
    ),
  ],
);
