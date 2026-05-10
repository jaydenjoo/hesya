import "server-only";

import {
  and,
  eq,
  gte,
  inArray,
  lte,
  messages,
  type DbClient,
} from "@hesya/database";

/**
 * E12-7 AI 응답 정확도 모니터링용 DAL.
 *
 * Phase 1-β draft review 모드(0022 마이그)가 도입한 messages.draftStatus +
 * editedFromAi + reviewedBy를 source로 사용. 신규 컬럼 0건.
 *
 * 정확도 1차 정의 (PRD §1063 "정확도 90%+", 수식은 미정의 → Spec § 4.1 H1
 * 분포 분석 진화 시점에 정교화):
 *   분모 = outbound 메시지 중 draft 결과 명확한 것 (sent + skipped)
 *   분자 = 사장이 그대로 승인 후 발송 (draft_status='sent' AND NOT editedFromAi)
 *   정확도 = 분자 / 분모
 *
 * 제외:
 *   - pending_review: 결과 미정 → 표본에 포함 X
 *   - direct: AI 미사용 (수동 작성) → 모니터링 무관
 *   - approved: 일시 상태 (곧 sent로 전이)
 *
 * 한계 (TODO Epic1 H1 분석):
 *   - 작은 수정(1글자) vs 전면 수정 구분 X → 둘 다 부정확으로 카운트
 *   - 사장이 보낸 후 고객 만족도 신호 미반영
 *   - skip 사유 (실수 / 의도) 구분 X
 */

/**
 * 정확도 표본에 포함되는 draft_status (분모).
 *
 * sent + skipped만 — pending_review는 미정, approved는 일시 상태, direct는 AI 무관.
 */
const TERMINAL_DRAFT_STATUSES = ["sent", "skipped"] as const;

const SENT_STATUS = "sent";

/**
 * messages 테이블에서 draftStatus + editedFromAi 두 컬럼만 select하는 minimal row.
 * Drizzle `$inferSelect` 전체 타입 노출 회피 (DAL 외부 의존성 최소화).
 *
 * test 파일(`ai-accuracy.test.ts`)에서 mock row 구성에 재사용 — 중복 선언으로
 * 인한 silent drift 방지를 위해 export.
 */
export type DraftSignalRow = {
  draftStatus: string | null;
  editedFromAi: boolean | null;
};

export interface AccuracyMetrics {
  sampleSize: number;
  acceptedCount: number;
  editedCount: number;
  skippedCount: number;
  accuracy: number;
}

export interface AccuracyMetricsFilter {
  fromDate?: Date;
  toDate?: Date;
}

/**
 * 정확도 metrics 집계.
 *
 * SQL aggregate 대신 row fetch + JS 집계 — Phase 1-β seed 데이터 ~3건 + 베타
 * 5곳 운영 시 일 수십~수백 건 수준. row 수 폭증 시 SQL aggregate로 교체.
 *
 * TODO(Epic1): 베타 운영 1주 후 H1 수정률 분포 분석 결과로 metric 정의 정교화.
 *
 * @returns 0건/표본부족 안전 — sampleSize=0이면 accuracy=0 (NaN 차단)
 */
export async function getAccuracyMetrics(
  db: DbClient,
  filter: AccuracyMetricsFilter = {},
): Promise<AccuracyMetrics> {
  const conditions = [
    eq(messages.direction, "outbound"),
    inArray(messages.draftStatus, [...TERMINAL_DRAFT_STATUSES]),
    filter.fromDate ? gte(messages.createdAt, filter.fromDate) : undefined,
    filter.toDate ? lte(messages.createdAt, filter.toDate) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const rows: DraftSignalRow[] = await db
    .select({
      draftStatus: messages.draftStatus,
      editedFromAi: messages.editedFromAi,
    })
    .from(messages)
    .where(and(...conditions));

  return aggregateAccuracy(rows);
}

/**
 * row → metrics 집계 (pure function, test 용이).
 *
 * 0건 안전: sampleSize=0이면 accuracy=0 (Number.isFinite 보장).
 *
 * @see TERMINAL_DRAFT_STATUSES — 호출자가 미리 필터한 row만 들어온다고 가정하지만,
 *   다른 status가 섞여 들어와도 무시 (방어적 카운트).
 */
export function aggregateAccuracy(rows: DraftSignalRow[]): AccuracyMetrics {
  let acceptedCount = 0;
  let editedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    if (row.draftStatus === SENT_STATUS) {
      if (row.editedFromAi === true) {
        editedCount += 1;
      } else {
        acceptedCount += 1;
      }
    } else if (row.draftStatus === "skipped") {
      skippedCount += 1;
    }
    // 그 외(pending_review/approved/direct/null)는 분모 무시 — TERMINAL_DRAFT_STATUSES만 사용.
  }

  const sampleSize = acceptedCount + editedCount + skippedCount;
  const accuracy = sampleSize > 0 ? acceptedCount / sampleSize : 0;

  return {
    sampleSize,
    acceptedCount,
    editedCount,
    skippedCount,
    accuracy,
  };
}
