import { payments } from "@hesya/database/schema";
import { z } from "zod";

export const paymentInsertSchema = z.object({
  id: z.string().uuid().optional(),
  bookingId: z.string().uuid().nullish(),
  amountKrw: z.number().int().nullish(),
  amountForeign: z.string().nullish(),
  currencyForeign: z.string().nullish(),
  exchangeRate: z.string().nullish(),
  provider: z.string().nullish(),
  providerTransactionId: z.string().nullish(),
  status: z.string().nullish(),
  feeSaasKrw: z.number().int().nullish(),
  createdAt: z.date().nullish(),
});

export const paymentSelectSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  amountKrw: z.number().int().nullable(),
  amountForeign: z.string().nullable(),
  currencyForeign: z.string().nullable(),
  exchangeRate: z.string().nullable(),
  provider: z.string().nullable(),
  providerTransactionId: z.string().nullable(),
  status: z.string().nullable(),
  feeSaasKrw: z.number().int().nullable(),
  createdAt: z.date().nullable(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
