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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
