import { stores } from "@hesya/database/schema";
import { z } from "zod";

export const STORE_CATEGORIES = [
  "hair_general",
  "skin_beauty",
  "nail",
  "makeup",
  "composite",
  "free_personal_color",
  "free_makeup_class",
  "free_hanbok",
  "free_kpop_class",
] as const;

export const STORE_VERIFICATION_STATUSES = [
  "pending",
  "auto_approved",
  "manual_review",
  "rejected",
] as const;

export const storeInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  category: z.enum(STORE_CATEGORIES).nullish(),
  region: z.string().nullish(),
  address: z.unknown().nullish(),
  phone: z.string().nullish(),
  businessLicenseNumber: z.string().nullish(),
  businessLicenseImageUrl: z.string().nullish(),
  taxRefundRegistered: z.boolean().nullish(),
  verificationStatus: z.enum(STORE_VERIFICATION_STATUSES).nullish(),
  createdAt: z.date().nullish(),
});

export const storeSelectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(STORE_CATEGORIES).nullable(),
  region: z.string().nullable(),
  address: z.unknown().nullable(),
  phone: z.string().nullable(),
  businessLicenseNumber: z.string().nullable(),
  businessLicenseImageUrl: z.string().nullable(),
  taxRefundRegistered: z.boolean().nullable(),
  verificationStatus: z.enum(STORE_VERIFICATION_STATUSES).nullable(),
  createdAt: z.date().nullable(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
