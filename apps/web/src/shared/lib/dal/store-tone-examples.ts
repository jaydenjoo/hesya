import "server-only";
import {
  desc,
  eq,
  sql,
  storeToneExamples,
  type DbClient,
} from "@hesya/database";

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

/**
 * S2 — 매장당 row cap. listRecentToneExamples default 10 대비 충분히 크면서
 * storage growth 방어 (rate limit 30/h × 30일 ≈ 21,600 row/매장 가능 →
 * 100으로 상한). cap 변경 시 본 상수만 수정.
 */
const STORE_TONE_EXAMPLE_CAP = 100;

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
  if (!inserted[0]) return null;

  // S2 — cap 초과 시 oldest 삭제. cap 안쪽 ID(최신 N개) 외 row를 일괄
  // DELETE. service_role connection 전제 (RLS bypass). 정상 흐름에서 매번
  // 최대 1 row 삭제 (insert 1 + delete 1).
  await db.execute(sql`
    DELETE FROM store_tone_examples
    WHERE store_id = ${storeId}
      AND id NOT IN (
        SELECT id FROM store_tone_examples
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${STORE_TONE_EXAMPLE_CAP}
      )
  `);

  return inserted[0];
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
