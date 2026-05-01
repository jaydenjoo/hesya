import { reviews } from "@hesya/database/schema";
import { z } from "zod";

export const reviewInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  source: z.string().nullish(),
  sourceReviewId: z.string().nullish(),
  rating: z.number().int().nullish(),
  content: z.string().nullish(),
  language: z.string().nullish(),
  sentiment: z.string().nullish(),
  fetchedAt: z.date().nullish(),
});

export const reviewSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  source: z.string().nullable(),
  sourceReviewId: z.string().nullable(),
  rating: z.number().int().nullable(),
  content: z.string().nullable(),
  language: z.string().nullable(),
  sentiment: z.string().nullable(),
  fetchedAt: z.date().nullable(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
