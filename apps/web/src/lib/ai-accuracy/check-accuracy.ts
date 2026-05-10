import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { DbClient } from "@hesya/database";

import { getAccuracyMetrics } from "@/shared/lib/dal/ai-accuracy";

import { ACCURACY_THRESHOLD, MIN_SAMPLE_SIZE } from "./thresholds";

/**
 * E12-7 AI 응답 정확도 모니터링 — 임계치 미달 감지 + Sentry warning 발송.
 *
 * Phase 1-γ.1.3 인프라 단계 — 본 함수는 호출 자체 가능. 표본이 MIN_SAMPLE_SIZE
 * 미만이면 평가 skip (1~2건만으로 정확도 noise).
 *
 * 현재 호출처 0건 — Epic 1 운영 데이터 누적 후 호출 timing 결정 (cron vs N건마다
 * vs 매 메시지). PRD §1063 "즉시 알림"이 모호 → 베타 1주 후 Sentry alert 발생
 * 빈도 보고 결정. admin 페이지(ai-accuracy/page.tsx)는 metrics 시각화만 담당.
 *
 * 비유: 학생 평균이 90점 미만이면 학부모에게 알림. 단 시험 5번 친 학생만 평균
 * 의미 있고, 1~2번만 친 학생은 평가 보류.
 *
 * @returns 검사 결과. anomalies 비어 있으면 정상(또는 표본 부족).
 */
export interface AccuracyAnomaly {
  metric: "accuracy";
  value: number;
  threshold: number;
  sampleSize: number;
}

export interface AccuracyCheckResult {
  checkedAt: Date;
  sampleSize: number;
  evaluated: boolean;
  anomalies: AccuracyAnomaly[];
}

export async function checkAiAccuracyAnomaly(
  db: DbClient,
  options: { fromDate?: Date; toDate?: Date } = {},
): Promise<AccuracyCheckResult> {
  const checkedAt = new Date();
  const metrics = await getAccuracyMetrics(db, options);
  const anomalies: AccuracyAnomaly[] = [];

  const evaluated = metrics.sampleSize >= MIN_SAMPLE_SIZE;
  if (evaluated && metrics.accuracy < ACCURACY_THRESHOLD) {
    anomalies.push({
      metric: "accuracy",
      value: metrics.accuracy,
      threshold: ACCURACY_THRESHOLD,
      sampleSize: metrics.sampleSize,
    });
  }

  for (const a of anomalies) {
    Sentry.captureMessage("ai-accuracy-low", {
      level: "warning",
      tags: {
        feature: "ai-accuracy",
        metric: a.metric,
      },
      extra: {
        value: a.value,
        threshold: a.threshold,
        sampleSize: a.sampleSize,
        windowFrom: options.fromDate?.toISOString(),
        windowTo: options.toDate?.toISOString(),
      },
    });
  }

  return {
    checkedAt,
    sampleSize: metrics.sampleSize,
    evaluated,
    anomalies,
  };
}
