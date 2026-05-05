import "server-only";
import { desc, eq, storeToneExamples, type DbClient } from "@hesya/database";

/**
 * Phase 2-B — 매장 톤 학습 (사장님 말투 reference) DAL.
 *
 * **Cross-tenant 격리**: 모든 select/insert에 storeId 필수. application은
 * service_role connection이라 RLS bypass이지만, DAL 레벨에서 storeId 가드로
 * 코드 실수 방지 (다른 매장 examples 학습/조회 버그 차단).
 *
 * **명시 학습만**: outbound 자동 저장은 별 Task. 본 모듈은 사장이 명시
 * 클릭한 텍스트만 insert.
 */

type StoreToneExample = typeof storeToneExamples.$inferSelect;

export async function insertToneExample(
  db: DbClient,
  storeId: string,
  content: string,
): Promise<StoreToneExample | null> {
  const inserted = await db
    .insert(storeToneExamples)
    .values({
      storeId,
      content,
    })
    .returning();
  return inserted[0] ?? null;
}

/**
 * 최근 N개 (default 10) 매장 톤 예시 조회. generate-reply.ts의 system
 * prompt에 few-shot reference로 주입된다.
 *
 * 정렬: created_at DESC. 가장 최근 학습이 prompt 상단에 오도록 caller가
 * 필요 시 reverse 처리. 단일 인덱스 (store_id, created_at DESC) 스캔.
 */
export async function listRecentToneExamples(
  db: DbClient,
  storeId: string,
  limit?: number,
): Promise<StoreToneExample[]> {
  return db
    .select()
    .from(storeToneExamples)
    .where(eq(storeToneExamples.storeId, storeId))
    .orderBy(desc(storeToneExamples.createdAt))
    .limit(limit ?? 10);
}
