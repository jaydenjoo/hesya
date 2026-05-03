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
  // E9-10 분기별 재검증 cron이 LOCALDATA에 다시 검색할 때 필요. 첫 매칭 시
  // 가장 비슷한 후보의 사업장명·도로명주소를 저장 (NTS는 b_no/p_nm만 줘서
  // LOCALDATA 검색 키워드로 부족). cron이 이 두 컬럼으로 재검색 → 영업 상태
  // 변경 감지.
  localdataBplcNm: text("localdata_bplc_nm"),
  localdataRoadNmAddr: text("localdata_road_nm_addr"),

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
