import { storeVerifications } from "@hesya/database/schema";
import { z } from "zod";
import { STORE_VERIFICATION_STATUSES } from "./stores";

export const storeVerificationInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  businessNumber: z.string(),
  representativeName: z.string(),
  startDate: z.string().nullish(),
  ntsValidationResult: z.string().nullish(),
  ntsStatus: z.string().nullish(),
  ntsTaxType: z.string().nullish(),
  localdataMatched: z.boolean().nullish(),
  localdataBusinessType: z.string().nullish(),
  localdataStatus: z.string().nullish(),
  categoryClassified: z.string().nullish(),
  categoryConfidence: z.string().nullish(),
  selfDeclarationSignedAt: z.date().nullish(),
  declarationNoMassage: z.boolean().nullish(),
  declarationNoMedicalDevice: z.boolean().nullish(),
  declarationNoOrientalMedicine: z.boolean().nullish(),
  ocrExtractedData: z.unknown().nullish(),
  ocrMatchScore: z.string().nullish(),
  keywordScanPassed: z.boolean().nullish(),
  flaggedKeywords: z.string().array().nullish(),
  // v0005 마이그레이션: NOT NULL DEFAULT 'pending' + CHECK. Insert 시 생략하면
  // DB가 'pending' 채움 → optional.
  verificationStatus: z.enum(STORE_VERIFICATION_STATUSES).optional(),
  rejectionReason: z.string().nullish(),
  reviewedBy: z.string().uuid().nullish(),
  reviewedAt: z.date().nullish(),
  lastRevalidationAt: z.date().nullish(),
  nextRevalidationDue: z.date().nullish(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export const storeVerificationSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  businessNumber: z.string(),
  representativeName: z.string(),
  startDate: z.string().nullable(),
  ntsValidationResult: z.string().nullable(),
  ntsStatus: z.string().nullable(),
  ntsTaxType: z.string().nullable(),
  localdataMatched: z.boolean().nullable(),
  localdataBusinessType: z.string().nullable(),
  localdataStatus: z.string().nullable(),
  categoryClassified: z.string().nullable(),
  categoryConfidence: z.string().nullable(),
  selfDeclarationSignedAt: z.date().nullable(),
  declarationNoMassage: z.boolean().nullable(),
  declarationNoMedicalDevice: z.boolean().nullable(),
  declarationNoOrientalMedicine: z.boolean().nullable(),
  ocrExtractedData: z.unknown().nullable(),
  ocrMatchScore: z.string().nullable(),
  keywordScanPassed: z.boolean().nullable(),
  flaggedKeywords: z.string().array().nullable(),
  // v0005 마이그레이션: NOT NULL → DB select는 항상 enum 중 하나.
  verificationStatus: z.enum(STORE_VERIFICATION_STATUSES),
  rejectionReason: z.string().nullable(),
  reviewedBy: z.string().uuid().nullable(),
  reviewedAt: z.date().nullable(),
  lastRevalidationAt: z.date().nullable(),
  nextRevalidationDue: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export type StoreVerification = typeof storeVerifications.$inferSelect;
export type NewStoreVerification = typeof storeVerifications.$inferInsert;
