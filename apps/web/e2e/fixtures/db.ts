/**
 * Playwright E2E DB fixture.
 *
 * `HESYA_TEST_DATABASE_URL` 환경변수의 격리된 PostgreSQL에 직접 연결하여
 * 시드/리셋. test-helpers/db.ts의 헬퍼를 그대로 재사용 (server-only 제거됨).
 *
 * 호출 측에서 반드시 prod DB가 아닌지 확인하고 사용할 것 — 데이터 손실 위험.
 */
import { createDbClient } from "@hesya/database";
import {
  resetDb,
  seedStore,
  seedCustomer,
  seedUser,
  seedStoreOwner,
  seedStoreIntegration,
  seedConversation,
  seedMessage,
} from "../../src/test-helpers/db";

function requireTestDbUrl(): string {
  const url = process.env.HESYA_TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL 환경변수가 필요합니다.",
    );
  }
  if (!url.startsWith("postgres")) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL은 postgres URL이어야 합니다.",
    );
  }
  // prod URL 실수 주입 방지 — localhost / 127.0.0.1 / supabase local / "test" 키워드만 허용.
  // E2E는 격리된 schema/DB만 사용해야 하며, prod URL은 데이터 손실 위험.
  const isLocal =
    /(?:^|@)(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url) ||
    /\btest\b/i.test(url) ||
    /\.supabase\.local\b/i.test(url);
  if (!isLocal) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL은 localhost/127.0.0.1/test/supabase.local 만 허용. " +
        "prod URL 실수 주입 차단.",
    );
  }
  return url;
}

export function createTestDb() {
  return createDbClient(requireTestDbUrl());
}

export {
  resetDb,
  seedStore,
  seedCustomer,
  seedUser,
  seedStoreOwner,
  seedStoreIntegration,
  seedConversation,
  seedMessage,
};
