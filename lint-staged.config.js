/**
 * lint-staged — 변경된 파일만 빠르게 검증 (monorepo)
 *
 * commit 시 자동 실행 (.husky/pre-commit)
 *
 * eslint는 apps/web 워크스페이스에만 설치되어 있어
 * apps/web 하위 파일에 한해 --filter로 실행한다.
 */
module.exports = {
  "apps/web/**/*.{ts,tsx,js,jsx,mjs,cjs}": [
    "pnpm prettier --write",
    "pnpm --filter @hesya/web exec eslint --fix --max-warnings 0",
  ],
  "**/*.{ts,tsx,js,jsx,mjs,cjs}": ["pnpm prettier --write"],
  "**/*.{json,md,css,yaml,yml}": ["pnpm prettier --write"],
};
