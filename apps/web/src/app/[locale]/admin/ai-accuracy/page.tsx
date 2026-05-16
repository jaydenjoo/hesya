import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/shared/config/env";
import {
  ACCURACY_THRESHOLD,
  MIN_SAMPLE_SIZE,
} from "@/lib/ai-accuracy/thresholds";
import { getAccuracyMetrics } from "@/shared/lib/dal/ai-accuracy";
import { requireAdminEmail } from "@/shared/lib/admin-guard";

/**
 * E12-7 AI 응답 정확도 모니터링 — admin 대시보드 (Phase 1-γ.1.3 인프라 단계).
 *
 * 24h 윈도우 — 어제 자정~지금 (PRD §1063 "즉시 알림" 정신, 단 호출 timing은
 * Epic 1 운영 후 결정). 표본 < MIN_SAMPLE_SIZE면 "표본 부족" 카드만 표시.
 *
 * 정확도 1차 정의: sent (no edit) / (sent + skipped). 자세한 산출 근거는
 * `dal/ai-accuracy.ts` JSDoc 참조.
 */
export default async function AdminAiAccuracyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const db = createDbClient(env.DATABASE_URL);
  const metrics = await getAccuracyMetrics(db, {
    fromDate: twentyFourHoursAgo,
    toDate: now,
  });

  const evaluated = metrics.sampleSize >= MIN_SAMPLE_SIZE;
  const accuracyExceeded = evaluated && metrics.accuracy < ACCURACY_THRESHOLD;
  const samplePct = Math.min(100, (metrics.sampleSize / MIN_SAMPLE_SIZE) * 100);
  const accuracyPct = evaluated ? metrics.accuracy * 100 : 0;
  const totalDecisions =
    metrics.acceptedCount + metrics.editedCount + metrics.skippedCount;
  const acceptedSharePct =
    totalDecisions > 0 ? (metrics.acceptedCount / totalDecisions) * 100 : 0;

  return (
    <div className="min-h-full bg-hesya-peach-50/30">
      <PageHeader
        eyebrow="Admin · AI Accuracy"
        title="AI 응답 정확도"
        subtitle={`24시간 윈도우. 정확도 = (사장이 그대로 보낸 초안) / (sent + skipped). ${(ACCURACY_THRESHOLD * 100).toFixed(0)}% 미만 시 Sentry warning. 표본 최소 ${MIN_SAMPLE_SIZE}건 이상일 때만 평가.`}
        right={
          <p className="font-mono text-[11px] text-hesya-navy-900/55">
            최근 검사: {now.toISOString()}
          </p>
        }
      />
      <div className="container py-8">
        {!evaluated && (
          <section className="mb-8 rounded-md border border-hesya-peach-200 bg-hesya-peach-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-hesya-navy-900">
                  표본 부족 — 평가 보류
                </h2>
                <p className="mt-1 text-sm text-hesya-navy-900/80">
                  현재 표본 {metrics.sampleSize}건 (최소 {MIN_SAMPLE_SIZE}건
                  필요). 베타 운영 데이터 누적 시 자동 활성화됩니다. AI 초안
                  결과(sent / skipped)가 누적되어야 정확도 평가 가능 —
                  pending_review 단계 메시지는 표본에 포함되지 않습니다.
                </p>
              </div>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-hesya-amber-600">
                {metrics.sampleSize}/{MIN_SAMPLE_SIZE}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full bg-hesya-amber-500"
                style={{ width: `${samplePct}%` }}
              />
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="정확도 (24h)"
            value={evaluated ? (metrics.accuracy * 100).toFixed(1) : "—"}
            unit={evaluated ? "%" : undefined}
            alert={accuracyExceeded}
            alertReason={`임계치 ${(ACCURACY_THRESHOLD * 100).toFixed(0)}% 미달`}
            subtext={evaluated ? undefined : "표본 부족"}
            progressPct={evaluated ? accuracyPct : undefined}
            thresholdPct={ACCURACY_THRESHOLD * 100}
            tone={accuracyExceeded ? "danger" : evaluated ? "ok" : "muted"}
          />
          <MetricCard
            label="표본 크기 (24h)"
            value={metrics.sampleSize.toString()}
            unit="건"
            subtext={`최소 ${MIN_SAMPLE_SIZE}건 필요`}
            progressPct={samplePct}
            tone={evaluated ? "ok" : "warn"}
          />
          <MetricCard
            label="그대로 승인"
            value={metrics.acceptedCount.toString()}
            unit="건"
            subtext={
              totalDecisions > 0
                ? `share ${acceptedSharePct.toFixed(0)}%`
                : "editedFromAi=false"
            }
            progressPct={totalDecisions > 0 ? acceptedSharePct : undefined}
            tone="ok"
          />
          <MetricCard
            label="수정 / 무시"
            value={`${metrics.editedCount + metrics.skippedCount}`}
            unit="건"
            subtext={`수정 ${metrics.editedCount} / 무시 ${metrics.skippedCount}`}
            tone={
              metrics.editedCount + metrics.skippedCount > 0 ? "warn" : "muted"
            }
          />
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold text-hesya-navy-900">
            정확도 정의 (1차)
          </h2>
          <ul className="space-y-2 text-sm">
            <DefItem
              label="분모"
              value="outbound + draftStatus IN (sent, skipped)"
            />
            <DefItem
              label="분자"
              value="draftStatus = sent AND editedFromAi != true"
            />
            <DefItem
              label="제외"
              value="pending_review (미정), approved (일시), direct (AI 미사용)"
            />
          </ul>
          <p className="text-xs text-hesya-navy-900/60">
            1차 정의. 작은 수정(1글자) vs 전면 수정 구분 X — 둘 다 부정확으로
            카운트. Spec §4.1 H1 분포 분석 후 Epic 1 안정화 시 정교화 예정.
            임계치 코드 상수:{" "}
            <code className="font-mono">
              apps/web/src/lib/ai-accuracy/thresholds.ts
            </code>
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtext,
  alert,
  alertReason,
  progressPct,
  thresholdPct,
  tone = "muted",
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  alert?: boolean;
  alertReason?: string;
  /** 0~100. 미전달 시 progress bar 미렌더. */
  progressPct?: number;
  /** 0~100. progress 위에 vertical marker 표시 (정확도 임계치). */
  thresholdPct?: number;
  /** progress bar 색조. */
  tone?: "ok" | "warn" | "danger" | "muted";
}) {
  const barTone = alert
    ? "bg-[#c9483a]"
    : tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-hesya-amber-500"
        : tone === "danger"
          ? "bg-[#c9483a]"
          : "bg-hesya-navy-900/30";
  return (
    <div
      className={`rounded-md border p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] transition ${
        alert
          ? "border-[#e5c0ba] bg-[#faefec]"
          : "border-gray-200 bg-white hover:border-hesya-amber-500/40"
      }`}
    >
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[28px] font-medium italic leading-none tracking-[-0.02em] ${
            alert ? "text-[#c9483a]" : "text-hesya-navy-900"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[12px] font-medium text-gray-500">{unit}</span>
        )}
      </div>
      {subtext && (
        <div className="mt-1.5 text-[11px] text-gray-500">{subtext}</div>
      )}
      {progressPct !== undefined && (
        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
          <div
            className={`h-full ${barTone}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
          {thresholdPct !== undefined && (
            <span
              aria-hidden="true"
              className="absolute top-[-2px] h-[10px] w-px bg-hesya-navy-900/55"
              style={{ left: `${Math.min(100, Math.max(0, thresholdPct))}%` }}
            />
          )}
        </div>
      )}
      {alert && alertReason && (
        <div className="mt-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#c9483a]">
          ⚠ {alertReason}
        </div>
      )}
    </div>
  );
}

function DefItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-medium text-hesya-navy-900">{label}:</span>
      <code className="font-mono text-xs">{value}</code>
    </li>
  );
}
