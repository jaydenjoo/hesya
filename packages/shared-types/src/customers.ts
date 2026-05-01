import { customers } from "@hesya/database/schema";
import { z } from "zod";

export const customerInsertSchema = z.object({
  id: z.string().uuid().optional(),
  externalId: z.string().nullish(),
  channel: z.string().nullish(),
  nationality: z.string().nullish(),
  preferredLanguage: z.string().nullish(),
  paymentMethodPreferred: z.string().nullish(),
  totalVisits: z.number().int().nullish(),
  ltvKrw: z.number().int().nullish(),
});

export const customerSelectSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string().nullable(),
  channel: z.string().nullable(),
  nationality: z.string().nullable(),
  preferredLanguage: z.string().nullable(),
  paymentMethodPreferred: z.string().nullable(),
  totalVisits: z.number().int().nullable(),
  ltvKrw: z.number().int().nullable(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
