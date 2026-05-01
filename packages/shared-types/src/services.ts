import { services } from "@hesya/database/schema";
import { z } from "zod";

export const serviceInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  nameKo: z.string(),
  nameEn: z.string().nullish(),
  nameJa: z.string().nullish(),
  nameZhCn: z.string().nullish(),
  nameZhTw: z.string().nullish(),
  nameVi: z.string().nullish(),
  priceKrw: z.number().int(),
  durationMinutes: z.number().int().nullish(),
  category: z.string().nullish(),
});

export const serviceSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  nameKo: z.string(),
  nameEn: z.string().nullable(),
  nameJa: z.string().nullable(),
  nameZhCn: z.string().nullable(),
  nameZhTw: z.string().nullable(),
  nameVi: z.string().nullable(),
  priceKrw: z.number().int(),
  durationMinutes: z.number().int().nullable(),
  category: z.string().nullable(),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
