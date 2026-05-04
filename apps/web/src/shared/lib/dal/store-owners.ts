import "server-only";
import { eq, storeOwners, type DbClient } from "@hesya/database";

export async function findByUserId(
  db: DbClient,
  userId: string,
): Promise<{ storeId: string; role: "owner" | "manager" } | null> {
  const rows = await db
    .select()
    .from(storeOwners)
    .where(eq(storeOwners.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return {
    storeId: rows[0].storeId,
    role: rows[0].role as "owner" | "manager",
  };
}
