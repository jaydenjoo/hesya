/**
 * lint-staged — 변경된 파일만 빠르게 검증
 *
 * commit 시 자동 실행 (.husky/pre-commit)
 */
module.exports = {
  "*.{ts,tsx}": ["pnpm prettier --write", "pnpm eslint --fix --max-warnings 0"],
  "*.{js,jsx,mjs,cjs}": [
    "pnpm prettier --write",
    "pnpm eslint --fix --max-warnings 0",
  ],
  "*.{json,md,css}": ["pnpm prettier --write"],
};
