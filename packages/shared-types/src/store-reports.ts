import { storeReports } from "@hesya/database/schema";
import { z } from "zod";

export const storeReportInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  reporterType: z.string().nullish(),
  reportReason: z.string().nullish(),
  description: z.string().nullish(),
  evidenceUrls: z.string().array().nullish(),
  status: z.string().nullish(),
  resolution: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export const storeReportSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  reporterType: z.string().nullable(),
  reportReason: z.string().nullable(),
  description: z.string().nullable(),
  evidenceUrls: z.string().array().nullable(),
  status: z.string().nullable(),
  resolution: z.string().nullable(),
  createdAt: z.date().nullable(),
});

export type StoreReport = typeof storeReports.$inferSelect;
export type NewStoreReport = typeof storeReports.$inferInsert;
