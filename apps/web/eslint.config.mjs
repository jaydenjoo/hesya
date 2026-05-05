import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // test-helpers/* 는 *.test.* 와 e2e/* 에서만 import 가능.
  // server-only 가드의 기계적 대체 — production bundle 침입 차단.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/test-helpers/*", "**/test-helpers/*"],
              message:
                "test-helpers는 *.test.* 또는 e2e/* 에서만 import 가능. production bundle 침입 차단.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
