import { bookings } from "@hesya/database/schema";
import { z } from "zod";

export const bookingInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  customerId: z.string().uuid().nullish(),
  staffId: z.string().uuid().nullish(),
  serviceId: z.string().uuid().nullish(),
  scheduledAt: z.date(),
  status: z.string().nullish(),
  totalPriceKrw: z.number().int().nullish(),
  depositPaidKrw: z.number().int().nullish(),
  paymentMethod: z.string().nullish(),
  notesMultilang: z.unknown().nullish(),
  createdAt: z.date().nullish(),
});

export const bookingSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  customerId: z.string().uuid().nullable(),
  staffId: z.string().uuid().nullable(),
  serviceId: z.string().uuid().nullable(),
  scheduledAt: z.date(),
  status: z.string().nullable(),
  totalPriceKrw: z.number().int().nullable(),
  depositPaidKrw: z.number().int().nullable(),
  paymentMethod: z.string().nullable(),
  notesMultilang: z.unknown().nullable(),
  createdAt: z.date().nullable(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
