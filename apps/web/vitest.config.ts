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
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    reporters: ["default", new VitestReporter({ projectRoot })],
  },
});
