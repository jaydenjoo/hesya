import { staff } from "@hesya/database/schema";
import { z } from "zod";

export const staffInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  name: z.string(),
  languages: z.string().array().nullish(),
  portfolioUrls: z.string().array().nullish(),
  nonAsianWorks: z.boolean().nullish(),
});

export const staffSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  name: z.string(),
  languages: z.string().array().nullable(),
  portfolioUrls: z.string().array().nullable(),
  nonAsianWorks: z.boolean().nullable(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
