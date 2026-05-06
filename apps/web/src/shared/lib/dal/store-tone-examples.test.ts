import { describe, it, expect } from "vitest";

describe("dal.store-tone-examples (pure)", () => {
  it("module exports P2-B insert/list functions", async () => {
    const mod = await import("./store-tone-examples");
    expect(typeof mod.insertToneExample).toBe("function");
    expect(typeof mod.listRecentToneExamples).toBe("function");
  });

  it("insertToneExample: storeId + content으로 insert (cross-tenant 격리)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    // values에 storeId/content 명시
    expect(src).toMatch(
      /insertToneExample[\s\S]*?\.values\(\s*\{[\s\S]*?storeId[\s\S]*?content/,
    );
    // returning() 사용 → 단일 row 반환
    expect(src).toMatch(/insertToneExample[\s\S]*?\.returning\(/);
  });

  it("listRecentToneExamples: storeId 가드 + createdAt DESC + limit", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    // storeId eq 가드 (cross-tenant 격리)
    expect(src).toMatch(
      /listRecentToneExamples[\s\S]*?eq\(\s*\w+\.storeId\s*,\s*storeId/,
    );
    // 최신순 정렬
    expect(src).toMatch(
      /listRecentToneExamples[\s\S]*?desc\(\s*\w+\.createdAt/,
    );
    // limit 명시 (default + override 가능)
    expect(src).toMatch(/listRecentToneExamples[\s\S]*?\.limit\(/);
  });

  it("listRecentToneExamples: default limit = 10 (P2-B-D3 결정)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    // default 10 — Phase 2-B 결정 D3
    expect(src).toMatch(
      /listRecentToneExamples[\s\S]*?\.limit\(\s*limit\s*\?\?\s*10\s*\)/,
    );
  });

  it("server-only import (DAL 환경 격리)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    expect(src).toMatch(/import\s+["']server-only["']/);
  });

  // ─── S2: per-store row cap (storage growth 방어) ───

  it("S2: STORE_TONE_EXAMPLE_CAP 상수 = 100 (변경 추적)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    expect(src).toMatch(/STORE_TONE_EXAMPLE_CAP\s*=\s*100/);
  });

  it("S2: insertToneExample이 cap 초과 시 oldest 삭제", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-tone-examples.ts",
      "utf-8",
    );
    // insert 함수 안에 DELETE 로직 (per-store cap 적용)
    expect(src).toMatch(
      /insertToneExample[\s\S]*?DELETE\s+FROM\s+store_tone_examples/i,
    );
    // cap 상수 사용 (하드코딩 100이 두 번 나오는 것 방지)
    expect(src).toMatch(/insertToneExample[\s\S]*?STORE_TONE_EXAMPLE_CAP/);
  });
});
