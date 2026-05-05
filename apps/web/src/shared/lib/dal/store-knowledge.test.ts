import { describe, it, expect } from "vitest";

describe("dal.store-knowledge (pure)", () => {
  it("module exports B-4a CRUD + search functions", async () => {
    const mod = await import("./store-knowledge");
    expect(typeof mod.updateStoreKnowledge).toBe("function");
    expect(typeof mod.deleteStoreKnowledge).toBe("function");
    expect(typeof mod.listStoreKnowledge).toBe("function");
    expect(typeof mod.searchSimilarKnowledge).toBe("function");
  });

  it("createStoreKnowledge (limit 없는 원본) orphan 제거 (B-4 followup-2 Sec L-2)", async () => {
    const mod = await import("./store-knowledge");
    // 미래 개발자가 limit 없는 함수를 직접 호출하면 TOCTOU 재오픈 → 완전 제거.
    // createFAQ는 createStoreKnowledgeWithLimit만 사용.
    expect(
      (mod as Record<string, unknown>).createStoreKnowledge,
    ).toBeUndefined();
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

  it("createStoreKnowledgeWithLimit: insert empty 명시 가드 (Code-MEDIUM-3 inherited)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).not.toMatch(/return\s+inserted\[0\]!/);
    expect(src).toMatch(/createStoreKnowledgeWithLimit[\s\S]*?(throw|Error)/);
  });

  it("countStoreKnowledge export + storeId 가드 (B-4 followup C-1)", async () => {
    const mod = await import("./store-knowledge");
    expect(typeof mod.countStoreKnowledge).toBe("function");
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    expect(src).toMatch(
      /countStoreKnowledge[\s\S]*?eq\(\s*\w+\.storeId\s*,\s*storeId/,
    );
    // SELECT COUNT(*) 사용 — 페이로드 절약
    expect(src).toMatch(/countStoreKnowledge[\s\S]*?count\s*\(/i);
  });

  it("createStoreKnowledgeWithLimit: 트랜잭션 + advisory lock + count (B-4 followup C-2)", async () => {
    const mod = await import("./store-knowledge");
    expect(typeof mod.createStoreKnowledgeWithLimit).toBe("function");
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    // 트랜잭션 안에서 advisory lock + count → insert. TOCTOU 차단.
    expect(src).toMatch(/createStoreKnowledgeWithLimit[\s\S]*?\.transaction\(/);
    expect(src).toMatch(
      /createStoreKnowledgeWithLimit[\s\S]*?pg_advisory_xact_lock/,
    );
  });

  it("createStoreKnowledgeWithLimit: lock_timeout 설정 (Sec MEDIUM-1, DoS 방어)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/shared/lib/dal/store-knowledge.ts",
      "utf-8",
    );
    // lock 무한 대기 → 같은 storeId 동시 요청 폭주 시 Vercel 함수 타임아웃 →
    // 매장별 DoS. SET LOCAL lock_timeout으로 차단 (xact-scoped 자동 해제).
    expect(src).toMatch(
      /createStoreKnowledgeWithLimit[\s\S]*?SET\s+LOCAL\s+lock_timeout/i,
    );
  });
});
