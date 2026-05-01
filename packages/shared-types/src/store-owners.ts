import { storeOwners } from "@hesya/database/schema";
import { z } from "zod";

export const STORE_OWNER_ROLES = ["owner", "manager"] as const;

export const storeOwnerInsertSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  role: z.enum(STORE_OWNER_ROLES),
  createdAt: z.date().optional(),
});

export const storeOwnerSelectSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  role: z.enum(STORE_OWNER_ROLES),
  createdAt: z.date(),
});

export type StoreOwner = typeof storeOwners.$inferSelect;
export type NewStoreOwner = typeof storeOwners.$inferInsert;
