/**
 * Vitest 설정 — apps/web 단위 테스트.
 *
 * - environment: jsdom (RTL 컴포넌트 테스트 + window/document API 시뮬)
 * - setupFiles: jest-dom matchers extend + afterEach cleanup
 * - alias `@/`: Vite 7 native tsconfig paths 매핑
 * - globals: false — describe/it/expect를 명시 import. 마법 글로벌 회피.
 * - include: src 트리 안의 *.test.ts(x) / *.spec.ts(x)만.
 * - reporters: default + tdd-guard-vitest (결과를 `.claude/tdd-guard/data/`에
 *   기록 → tdd-guard hook이 RED/GREEN 상태 인식 가능). 모노레포 root를 전달.
 */
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitestReporter } from "tdd-guard-vitest";

const projectRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only`는 Next.js runtime이 client bundle에서 import 시 throw하는
      // 가드 패키지. 단위 테스트에는 의미 X (jsdom = test runner). no-op stub.
      "server-only": path.resolve(__dirname, "./vitest.server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    reporters: ["default", new VitestReporter({ projectRoot })],
    // Phase B-5d: integration test (HESYA_TEST_DATABASE_URL set 시) 다수 test
    // file이 같은 supabase DB를 공유. 병렬 worker fork가 resetDb/insert 중 race
    // → cross-file fail (단독 통과). singleFork로 직렬화. 단위 test는 cost 작음.
    //
    // Vitest 4: `test.poolOptions`는 제거되고 pool-specific 최상위 옵션
    // (`forks` / `threads` / `vmThreads` / `vmForks`)로 분리됨. 이전
    // `poolOptions: { forks: { singleFork } }`는 v4에서 silent ignore되어
    // 병렬 fork race로 다수 DAL test FK violation 폭발 회귀를 유발했음 (2026-05-14).
    pool: "forks",
    // @ts-expect-error vitest 4 InlineConfig type 정의에 pool-specific 옵션
    // (`forks`/`threads`/...) 미반영. runtime은 정상 수용 (위 deprecation 참조).
    forks: { singleFork: true },
  },
});
