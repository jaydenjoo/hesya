import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres client (serverless-tuned).
 *
 * `max: 1` + `idle_timeout: 20s` — Vercel serverless lambda 마다 createDbClient()
 * 호출 시 connection 폭증 방지. postgres.js 기본값 (max: 10)은 lambda 20개만
 * 동시 깨어나도 Supabase 한도 (Free 200) 즉시 초과 → EMAXCONN 에러로 sign-in
 * 등 모든 query 실패 (회귀 사례: 2026-05-19, /api/auth/sign-in/email HTTP 500).
 *
 * `prepare: false` — Supabase Transaction Pooler (port 6543) 호환 (prepared
 * statement 미지원). Session Pooler (port 5432) 사용 시에도 무해.
 */
export function createDbClient(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
export { schema };
export * from "./schema";

// 자주 쓰이는 SQL operator만 facade로 노출 (apps/web에 drizzle-orm 직접
// 의존성 추가 회피, layered architecture 유지)
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
  sum,
} from "drizzle-orm";
