import { describe, it, expect } from "vitest";

describe("dal.store-knowledge (pure)", () => {
  it("module exports B-4a CRUD + search functions", async () => {
    const mod = await import("./store-knowledge");
    expect(typeof mod.createStoreKnowledge).toBe("function");
    expect(typeof mod.updateStoreKnowledge).toBe("function");
    expect(typeof mod.deleteStoreKnowledge).toBe("function");
    expect(typeof mod.listStoreKnowledge).toBe("function");
    expect(typeof mod.searchSimilarKnowledge).toBe("function");
  });

  it("searchSimilarKnowledge: cosine similarity 정렬 + IS NOT NULL 가드", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    // pgvector cosine 연산자 (<=>) 사용
    expect(src).toMatch(/<=>/);
    // embedding IS NOT NULL 가드 (검색 시 임베딩 누락 row 제외)
    expect(src).toMatch(
      /embedding\s+IS\s+NOT\s+NULL|isNotNull\(\s*\w+\.embedding/i,
    );
  });

  it("searchSimilarKnowledge: storeId 필수 (cross-tenant 격리)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).toMatch(
      /searchSimilarKnowledge[\s\S]*?storeId[\s\S]*?eq\(\s*\w+\.storeId/,
    );
  });

  it("updateStoreKnowledge: storeId 가드 (cross-tenant 격리)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).toMatch(/updateStoreKnowledge[\s\S]*?eq\(\s*\w+\.storeId/);
  });

  it("deleteStoreKnowledge: storeId 가드 (cross-tenant 격리)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).toMatch(/deleteStoreKnowledge[\s\S]*?eq\(\s*\w+\.storeId/);
  });

  it("searchSimilarKnowledge: queryEmbedding 길이 가드 (Sec/Code MEDIUM)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).toMatch(
      /searchSimilarKnowledge[\s\S]*?queryEmbedding\.length\s*!==\s*EMBEDDING_DIMENSIONS/,
    );
  });

  it("createStoreKnowledge: insert empty 명시 가드 (Code-MEDIUM-3)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).not.toMatch(/return\s+inserted\[0\]!/);
    expect(src).toMatch(/createStoreKnowledge[\s\S]*?(throw|Error)/);
  });
});
