/**
 * Vitest 설정 — apps/web 단위 테스트.
 *
 * - environment: jsdom (RTL 컴포넌트 테스트 + window/document API 시뮬)
 * - setupFiles: jest-dom matchers extend + afterEach cleanup
 * - alias `@/`: Vite 7 native tsconfig paths 매핑
 * - globals: false — describe/it/expect를 명시 import. 마법 글로벌 회피.
 * - include: src 트리 안의 *.test.ts(x) / *.spec.ts(x)만.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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
  },
});
