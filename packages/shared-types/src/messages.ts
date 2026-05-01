import { messages } from "@hesya/database/schema";
import { z } from "zod";

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;

export const messageInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  customerId: z.string().uuid().nullish(),
  channel: z.string().nullish(),
  direction: z.enum(MESSAGE_DIRECTIONS).nullish(),
  originalText: z.string().nullish(),
  translatedText: z.string().nullish(),
  languageFrom: z.string().nullish(),
  languageTo: z.string().nullish(),
  aiResponded: z.boolean().nullish(),
  aiModel: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export const messageSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  customerId: z.string().uuid().nullable(),
  channel: z.string().nullable(),
  direction: z.enum(MESSAGE_DIRECTIONS).nullable(),
  originalText: z.string().nullable(),
  translatedText: z.string().nullable(),
  languageFrom: z.string().nullable(),
  languageTo: z.string().nullable(),
  aiResponded: z.boolean().nullable(),
  aiModel: z.string().nullable(),
  createdAt: z.date().nullable(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
