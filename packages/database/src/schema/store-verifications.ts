import {
  boolean,
  date,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const storeVerifications = pgTable("store_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  businessNumber: text("business_number").notNull(),
  representativeName: text("representative_name").notNull(),
  startDate: date("start_date"),

  ntsValidationResult: text("nts_validation_result"),
  ntsStatus: text("nts_status"),
  ntsTaxType: text("nts_tax_type"),

  localdataMatched: boolean("localdata_matched").default(false),
  localdataBusinessType: text("localdata_business_type"),
  localdataStatus: text("localdata_status"),

  categoryClassified: text("category_classified"),
  categoryConfidence: numeric("category_confidence"),

  selfDeclarationSignedAt: timestamp("self_declaration_signed_at", {
    withTimezone: true,
  }),
  declarationNoMassage: boolean("declaration_no_massage"),
  declarationNoMedicalDevice: boolean("declaration_no_medical_device"),
  declarationNoOrientalMedicine: boolean("declaration_no_oriental_medicine"),

  ocrExtractedData: jsonb("ocr_extracted_data"),
  ocrMatchScore: numeric("ocr_match_score"),

  keywordScanPassed: boolean("keyword_scan_passed"),
  flaggedKeywords: text("flagged_keywords").array(),

  verificationStatus: text("verification_status"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  lastRevalidationAt: timestamp("last_revalidation_at", { withTimezone: true }),
  nextRevalidationDue: timestamp("next_revalidation_due", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
