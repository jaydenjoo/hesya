/**
 * 로컬 Supabase에 packages/database/migrations/*.sql 전체 적용.
 *
 * Hybrid 마이그 상태 (0000~0010 drizzle / 0011~ manual SQL — packages/database/CLAUDE.md)
 * 이므로 drizzle-kit migrate 단독으로는 0011 이후를 적용 못 함. 본 스크립트는
 * `packages/database/migrations/` 폴더의 SQL 파일을 파일명 순서대로 일괄 실행.
 *
 * ⚠️ 안전:
 *   - `HESYA_TEST_DATABASE_URL` 필요 (localhost / 127.0.0.1 / test / supabase.local만 허용)
 *   - prod DB 절대 금지 — fixture와 동일한 URL 검증
 *   - 두 번째 실행 시 "already exists" / "duplicate" 에러는 자동 skip (idempotent 보호)
 *     단, 이는 휴리스틱이므로 깔끔한 재시작은 `supabase db reset` 권장
 *
 * 실행:
 *   pnpm --filter @hesya/database db:apply
 *
 * 베타 데모 setup 절차 (한 번만):
 *   1. supabase start
 *   2. pnpm --filter @hesya/database db:apply   # ← 본 스크립트
 *   3. pnpm seed:demo
 *   4. pnpm dev:demo
 */
import { config } from "dotenv";
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../../apps/web/.env.local") });

function requireLocalDbUrl(): string {
  const url = process.env.HESYA_TEST_DATABASE_URL;
  if (!url) {
    throw new Error("HESYA_TEST_DATABASE_URL 환경변수가 필요합니다.");
  }
  if (!url.startsWith("postgres")) {
    throw new Error("HESYA_TEST_DATABASE_URL은 postgres URL이어야 합니다.");
  }
  const isLocal =
    /(?:^|@)(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url) ||
    /\btest\b/i.test(url) ||
    /\.supabase\.local\b/i.test(url);
  if (!isLocal) {
    throw new Error(
      "HESYA_TEST_DATABASE_URL은 localhost/127.0.0.1/test/supabase.local만 허용. prod URL 차단.",
    );
  }
  return url;
}

async function main(): Promise<void> {
  const url = requireLocalDbUrl();
  const migrationsDir = path.resolve(__dirname, "../migrations");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("[db:apply] migrations 폴더가 비어 있음:", migrationsDir);
    process.exit(1);
  }

  console.log(`[db:apply] ${files.length}개 마이그레이션을 적용합니다.`);

  const sql = postgres(url, { max: 1 });

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const content = fs.readFileSync(fullPath, "utf8");
      process.stdout.write(`  → ${file} ... `);
      try {
        await sql.unsafe(content);
        console.log("✓");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/already exists|duplicate (column|key|object)/i.test(msg)) {
          console.log("⊘ skip (이미 적용됨)");
          continue;
        }
        console.log("✗");
        throw new Error(`${file} 적용 실패: ${msg}`);
      }
    }
    console.log("[db:apply] ✓ 모든 마이그레이션 적용 완료");
  } finally {
    await sql.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("[db:apply] 실패:", err);
    process.exit(1);
  });
