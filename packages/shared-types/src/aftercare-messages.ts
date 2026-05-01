import { aftercareMessages } from "@hesya/database/schema";
import { z } from "zod";

export const aftercareMessageInsertSchema = z.object({
  id: z.string().uuid().optional(),
  bookingId: z.string().uuid().nullish(),
  sendAt: z.date().nullish(),
  status: z.string().nullish(),
  template: z.string().nullish(),
  content: z.string().nullish(),
});

export const aftercareMessageSelectSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  sendAt: z.date().nullable(),
  status: z.string().nullable(),
  template: z.string().nullable(),
  content: z.string().nullable(),
});

export type AftercareMessage = typeof aftercareMessages.$inferSelect;
export type NewAftercareMessage = typeof aftercareMessages.$inferInsert;
