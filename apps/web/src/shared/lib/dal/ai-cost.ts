import "server-only";
import {
  and,
  count,
  gte,
  isNotNull,
  lte,
  messages,
  type DbClient,
} from "@hesya/database";
import { DAILY_BUDGET_KRW, estimateCostKrw } from "@/lib/ai-cost/model-pricing";

/**
 * Plan v3 M4.4 — AI cost 추정 DAL.
 *
 * messages.aiModel 컬럼 + 메시지당 평균 cost 상수 곱 → 일별 추정 cost.
 * Phase 2에서 token-level cost 컬럼 추가 시 정확 추적으로 교체.
 */

export interface DailyCostRow {
  date: string; // YYYY-MM-DD (Asia/Seoul)
  totalKrw: number;
  messageCount: number;
}

export interface ModelCostRow {
  model: string;
  messageCount: number;
  estimatedKrw: number;
}

export interface AiCostSummary {
  /** 오늘 추정 cost (KRW) */
  todayEstimatedKrw: number;
  /** 오늘 AI 메시지 수 */
  todayMessageCount: number;
  /** 일일 예산 (KRW) */
  dailyBudgetKrw: number;
  /** 오늘 예산 사용률 % (0~100+) */
  dailyBudgetPct: number;
  /** 최근 14일 daily 추정 cost */
  last14Days: DailyCostRow[];
  /** 모델별 분포 (이번 달) */
  byModel: ModelCostRow[];
}

/**
 * 최근 14일 + 이번 달 모델별 분포 집계.
 */
export async function getAiCostSummary(
  db: DbClient,
  now = new Date(),
): Promise<AiCostSummary> {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  // 14일치 — aiModel별 daily count. JS에서 cost 계산.
  const rows = await db
    .select({
      model: messages.aiModel,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        isNotNull(messages.aiModel),
        gte(messages.createdAt, fourteenDaysAgo),
        lte(messages.createdAt, now),
      ),
    );

  // daily 집계
  const dailyMap = new Map<string, { totalKrw: number; n: number }>();
  for (const r of rows) {
    // messages.createdAt은 NOT NULL이지만 drizzle type은 Date|null로 추론.
    // 안전 가드 후 사용.
    if (!r.createdAt) continue;
    const dateKey = formatDateKstYmd(r.createdAt);
    const existing = dailyMap.get(dateKey) ?? { totalKrw: 0, n: 0 };
    existing.totalKrw += estimateCostKrw(r.model);
    existing.n += 1;
    dailyMap.set(dateKey, existing);
  }

  // 14일 array (날짜 없는 day는 0)
  const last14Days: DailyCostRow[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = formatDateKstYmd(day);
    const row = dailyMap.get(key);
    last14Days.push({
      date: key,
      totalKrw: row?.totalKrw ?? 0,
      messageCount: row?.n ?? 0,
    });
  }

  // 오늘
  const todayKey = formatDateKstYmd(now);
  const today = dailyMap.get(todayKey) ?? { totalKrw: 0, n: 0 };

  // 이번 달 모델별
  const monthRows = await db
    .select({
      model: messages.aiModel,
      n: count(messages.id).mapWith(Number),
    })
    .from(messages)
    .where(
      and(
        isNotNull(messages.aiModel),
        gte(messages.createdAt, monthStart),
        lte(messages.createdAt, now),
      ),
    )
    .groupBy(messages.aiModel);

  const byModel: ModelCostRow[] = monthRows
    .map((r) => ({
      model: r.model ?? "unknown",
      messageCount: r.n,
      estimatedKrw: r.n * estimateCostKrw(r.model),
    }))
    .sort((a, b) => b.estimatedKrw - a.estimatedKrw);

  return {
    todayEstimatedKrw: today.totalKrw,
    todayMessageCount: today.n,
    dailyBudgetKrw: DAILY_BUDGET_KRW,
    dailyBudgetPct: Math.round((today.totalKrw / DAILY_BUDGET_KRW) * 100),
    last14Days,
    byModel,
  };
}

function formatDateKstYmd(date: Date): string {
  // Asia/Seoul 기준 YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}
