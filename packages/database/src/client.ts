import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDbClient(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
export { schema };
export * from "./schema";

// 자주 쓰이는 SQL operator만 facade로 노출 (apps/web에 drizzle-orm 직접
// 의존성 추가 회피, layered architecture 유지)
export { and, asc, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
