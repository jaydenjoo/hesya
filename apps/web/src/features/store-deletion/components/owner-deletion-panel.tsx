"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  cancelOwnerStoreDeletionAction,
  requestOwnerStoreDeletionAction,
  type OwnerDeletionResult,
} from "@/lib/store-deletion/actions";

/**
 * E12-9 — 사장 자가해지 패널.
 *
 * 활성 요청 없으면: 신청 폼 (사유 textarea + 빨간 버튼).
 * 활성 요청 있으면: D-N일 카운터 + 취소 버튼.
 *
 * Phase 1-ε 디자인 정합 (2026-05-16): disputes/onboarding 패턴 일치 적용 —
 * crit token (#c9483a / #fbeae5 / #e5c0ba) + peach card + mono eyebrow +
 * D-N large number + grace progress bar.
 */
export interface OwnerDeletionPanelProps {
  active: {
    scheduledPurgeAt: string;
    createdAt: string;
    reason: string | null;
  } | null;
}

const GRACE_DAYS = 30;

function daysUntil(target: Date, from = new Date()): number {
  const ms = target.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function OwnerDeletionPanel({ active }: OwnerDeletionPanelProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<OwnerDeletionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await requestOwnerStoreDeletionAction({
        reason: reason.trim() || undefined,
      });
      setResult(res);
      if (res.ok) {
        router.refresh();
      }
    });
  };

  const onCancel = () => {
    setResult(null);
    startTransition(async () => {
      const res = await cancelOwnerStoreDeletionAction();
      setResult(res);
      if (res.ok) {
        router.refresh();
      }
    });
  };

  if (active) {
    const purgeAt = new Date(active.scheduledPurgeAt);
    const createdAt = new Date(active.createdAt);
    const remaining = daysUntil(purgeAt);
    const elapsed = Math.min(GRACE_DAYS, GRACE_DAYS - remaining);
    const elapsedPct = (elapsed / GRACE_DAYS) * 100;
    const urgent = remaining <= 7;

    return (
      <section
        className={`max-w-2xl space-y-5 rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ring-1 ring-inset ${urgent ? "border-[#e5c0ba] ring-[#e5c0ba]" : "border-hesya-peach-200 ring-hesya-peach-200"}`}
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#c9483a]">
              §01 · Deletion In Progress
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbeae5] px-3 py-1 text-[12.5px] font-semibold text-[#c9483a]">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full bg-[#c9483a]"
                />
                해지 진행 중
              </span>
              <span className="rounded-full bg-hesya-peach-100 px-2.5 py-0.5 font-mono text-[11px] text-hesya-navy-900/80">
                {createdAt.toISOString().slice(0, 10)} 신청
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/55">
              예정 삭제일
            </p>
            <p
              className={`mt-1 font-mono text-[20px] font-bold tabular-nums ${urgent ? "text-[#c9483a]" : "text-hesya-navy-900"}`}
            >
              D-{remaining}일
            </p>
            <p className="font-mono text-[10px] text-hesya-navy-900/55">
              {purgeAt.toISOString().slice(0, 10)}
            </p>
          </div>
        </header>

        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-hesya-navy-900/55">
            <span>grace 진행</span>
            <span className="tabular-nums">
              {elapsed}/{GRACE_DAYS}일
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
            <div
              className={`h-full ${urgent ? "bg-[#c9483a]" : "bg-hesya-amber-500"}`}
              style={{ width: `${Math.min(100, elapsedPct)}%` }}
            />
          </div>
        </div>

        {active.reason && (
          <div className="rounded-md border border-hesya-peach-100 bg-hesya-peach-50/60 px-4 py-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
              해지 사유
            </p>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-hesya-navy-900/85">
              {active.reason}
            </p>
          </div>
        )}

        <div className="rounded-md bg-hesya-peach-50/40 p-4">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-amber-600">
            grace 기간 동안
          </p>
          <ul className="space-y-1.5 text-[12.5px] text-hesya-navy-900/80 [word-break:keep-all]">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-hesya-amber-600">
                •
              </span>
              <span>매장 인박스/AI 응답이 일시 정지됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-emerald-600">
                ✓
              </span>
              <span>예정일 전까지는 언제든 취소할 수 있습니다.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-[#c9483a]">
                ⚠
              </span>
              <span>
                예정일 이후에는 매장·고객·대화·매장 직원·예약 데이터가 모두 영구
                삭제됩니다 (복구 불가).
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md bg-hesya-navy-900 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-navy-900/90 disabled:opacity-40"
          >
            {pending ? "취소 중..." : "해지 취소"}
          </button>
          {result && !result.ok && (
            <span className="text-[12px] text-[#c9483a]">{result.message}</span>
          )}
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <section className="rounded-2xl border border-hesya-peach-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
        <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §01 · Deletion Notice
        </p>
        <ul className="space-y-2 text-[12.5px] text-hesya-navy-900/80 [word-break:keep-all]">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-hesya-amber-600">
              •
            </span>
            <span>
              해지 신청 후 30일간 grace 기간이 시작됩니다 (취소 가능).
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-hesya-amber-600">
              •
            </span>
            <span>grace 기간 동안 매장 인박스/AI 응답은 일시 정지됩니다.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-[#c9483a]">
              ⚠
            </span>
            <span>
              30일 후 매장 모든 데이터(고객·대화·예약·직원·정산)가 영구
              삭제됩니다.
            </span>
          </li>
          <li className="flex gap-2 text-hesya-navy-900/60">
            <span aria-hidden="true">§</span>
            <span>관련 법: 개인정보보호법 §21 (보유기간 경과 후 파기).</span>
          </li>
        </ul>
      </section>

      <label className="block">
        <span className="mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/65">
          해지 사유 (선택)
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="사업 종료, 서비스 불만족 등"
          className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          maxLength={2000}
        />
        <span className="mt-1 block text-right font-mono text-[10px] tabular-nums text-hesya-navy-900/45">
          {reason.length}/2000
        </span>
      </label>

      <label className="flex items-start gap-2.5 rounded-md bg-hesya-peach-50/60 px-4 py-3 text-[12.5px] [word-break:keep-all]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-[#c9483a]"
        />
        <span className="text-hesya-navy-900/85">
          30일 grace 종료 후 매장 데이터가 영구 삭제됨을 이해하며, 해지를
          신청합니다.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !confirmed}
          className="rounded-md bg-[#c9483a] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#b03d31] disabled:opacity-40"
        >
          {pending ? "신청 중..." : "매장 해지 신청"}
        </button>
        {result && !result.ok && (
          <span className="text-[12px] text-[#c9483a]">{result.message}</span>
        )}
      </div>
    </form>
  );
}
