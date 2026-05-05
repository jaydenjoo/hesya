import "server-only";
import {
  and,
  desc,
  eq,
  isNotNull,
  sql,
  storeKnowledge,
  type DbClient,
} from "@hesya/database";
import { EMBEDDING_DIMENSIONS } from "@/features/inbox/ai/embeddings";

/**
 * Phase B-4a — store_knowledge CRUD + RAG 검색.
 *
 * **Cross-tenant 격리**: 모든 mutation/select에 storeId 필수. application은
 * service_role connection이라 RLS bypass이지만, DAL 레벨에서 storeId 가드로
 * 코드 실수 방지 (e.g., 다른 매장의 FAQ를 잘못된 storeId로 검색하는 버그).
 *
 * **검색**: pgvector cosine distance (`<=>`) 연산자. 0(완전 일치) ~ 2(반대)
 * 범위. 거리 ASC 정렬 = 유사도 DESC. embedding IS NOT NULL 가드로 임베딩
 * 생성 실패한 row 제외.
 */

type StoreKnowledge = typeof storeKnowledge.$inferSelect;

export async function createStoreKnowledge(
  db: DbClient,
  input: {
    storeId: string;
    question: string;
    answer: string;
    embedding: number[] | null;
  },
): Promise<StoreKnowledge> {
  const inserted = await db
    .insert(storeKnowledge)
    .values({
      storeId: input.storeId,
      question: input.question,
      answer: input.answer,
      embedding: input.embedding,
    })
    .returning();
  const row = inserted[0];
  if (!row) {
    throw new Error("createStoreKnowledge: insert returned empty");
  }
  return row;
}

export async function updateStoreKnowledge(
  db: DbClient,
  id: string,
  storeId: string,
  patch: {
    question?: string;
    answer?: string;
    embedding?: number[] | null;
  },
): Promise<StoreKnowledge | null> {
  const updated = await db
    .update(storeKnowledge)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(storeKnowledge.id, id), eq(storeKnowledge.storeId, storeId)))
    .returning();
  return updated[0] ?? null;
}

export async function deleteStoreKnowledge(
  db: DbClient,
  id: string,
  storeId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(storeKnowledge)
    .where(and(eq(storeKnowledge.id, id), eq(storeKnowledge.storeId, storeId)))
    .returning({ id: storeKnowledge.id });
  return deleted.length > 0;
}

export async function listStoreKnowledge(
  db: DbClient,
  storeId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<StoreKnowledge[]> {
  return db
    .select()
    .from(storeKnowledge)
    .where(eq(storeKnowledge.storeId, storeId))
    .orderBy(desc(storeKnowledge.updatedAt))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);
}

/**
 * 매장별 FAQ 개수만 반환. count 한도 체크 전용 — list로 전체 row 페이로드
 * (~12KB/row × N) 가져오지 말고 단일 SELECT COUNT(*) 사용.
 */
export async function countStoreKnowledge(
  db: DbClient,
  storeId: string,
): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(storeKnowledge)
    .where(eq(storeKnowledge.storeId, storeId));
  return rows[0]?.n ?? 0;
}

/**
 * count 한도 보강 + insert를 단일 트랜잭션에 묶음 (TOCTOU 차단).
 *
 * **흐름**: pg_advisory_xact_lock(namespace, hashtext(storeId)) → count → insert.
 * 같은 매장의 동시 createFAQ 요청은 advisory lock 대기 → 직렬화. 트랜잭션
 * 종료 시 자동 해제 (xact = transaction-scoped). namespace=1로 다른 advisory
 * lock과 키 공간 분리.
 *
 * **반환**: 한도 초과면 `{ ok: false, reason: 'limit_exceeded' }` — caller에서
 * UI 메시지 처리. 일반 error는 throw 그대로 (e.g., DB 연결 실패).
 */
export async function createStoreKnowledgeWithLimit(
  db: DbClient,
  input: {
    storeId: string;
    question: string;
    answer: string;
    embedding: number[] | null;
  },
  maxCount: number,
): Promise<
  { ok: true; row: StoreKnowledge } | { ok: false; reason: "limit_exceeded" }
> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(1, hashtext(${input.storeId}::text))`,
    );
    const countRows = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(storeKnowledge)
      .where(eq(storeKnowledge.storeId, input.storeId));
    const current = countRows[0]?.n ?? 0;
    if (current >= maxCount) {
      return { ok: false as const, reason: "limit_exceeded" as const };
    }
    const inserted = await tx
      .insert(storeKnowledge)
      .values({
        storeId: input.storeId,
        question: input.question,
        answer: input.answer,
        embedding: input.embedding,
      })
      .returning();
    const row = inserted[0];
    if (!row) {
      throw new Error("createStoreKnowledgeWithLimit: insert returned empty");
    }
    return { ok: true as const, row };
  });
}

/**
 * 메시지 임베딩과 cosine distance가 가까운 top-k FAQ 반환 (RAG 검색).
 *
 * @param threshold 0.0~2.0 cosine distance 상한 (0=완전 일치). 0.5는 매우
 * 유사, 1.0은 무관 근처. MVP는 0.5로 시작 후 조정.
 */
export async function searchSimilarKnowledge(
  db: DbClient,
  storeId: string,
  queryEmbedding: number[],
  opts: { k?: number; threshold?: number } = {},
): Promise<Array<StoreKnowledge & { distance: number }>> {
  // 입력 가드: caller가 generateEmbedding 외 경로로 임의 벡터 전달 시
  // pgvector 런타임 에러를 클라이언트 500으로 흘리지 말고 사전에 차단.
  if (queryEmbedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `searchSimilarKnowledge: invalid embedding dim ${queryEmbedding.length} (expected ${EMBEDDING_DIMENSIONS})`,
    );
  }
  const k = opts.k ?? 3;
  const threshold = opts.threshold ?? 0.5;
  const queryVec = sql`${JSON.stringify(queryEmbedding)}::vector`;
  const distanceExpr = sql<number>`${storeKnowledge.embedding} <=> ${queryVec}`;

  return db
    .select({
      id: storeKnowledge.id,
      storeId: storeKnowledge.storeId,
      question: storeKnowledge.question,
      answer: storeKnowledge.answer,
      embedding: storeKnowledge.embedding,
      createdAt: storeKnowledge.createdAt,
      updatedAt: storeKnowledge.updatedAt,
      distance: distanceExpr,
    })
    .from(storeKnowledge)
    .where(
      and(
        eq(storeKnowledge.storeId, storeId),
        isNotNull(storeKnowledge.embedding),
        sql`${storeKnowledge.embedding} <=> ${queryVec} < ${threshold}`,
      ),
    )
    .orderBy(distanceExpr)
    .limit(k);
}
