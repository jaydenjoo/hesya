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
 * 디자인 minimal — Phase 1-ε에서 일괄 정합성 적용 (disputes 패턴 일치).
 */
export interface OwnerDeletionPanelProps {
  active: {
    scheduledPurgeAt: string;
    createdAt: string;
    reason: string | null;
  } | null;
}

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
    const remaining = daysUntil(purgeAt);
    return (
      <div className="max-w-2xl space-y-5 rounded border border-red-300 bg-red-50 p-6">
        <div>
          <h2 className="text-xl font-bold text-red-900">
            매장 해지 진행 중 — D-{remaining}일
          </h2>
          <p className="mt-1 text-sm text-red-800">
            예정된 데이터 삭제일: {purgeAt.toLocaleDateString("ko-KR")}{" "}
            (개인정보보호법 30일 grace 종료 시점)
          </p>
        </div>
        {active.reason && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">사유:</span> {active.reason}
          </p>
        )}
        <div className="rounded bg-white p-4 text-sm">
          <p className="mb-2 font-medium">grace 기간 동안:</p>
          <ul className="list-disc space-y-1 pl-5 text-gray-700">
            <li>매장 인박스/AI 응답이 일시 정지됩니다.</li>
            <li>예정일 전까지는 언제든 취소할 수 있습니다.</li>
            <li>
              예정일 이후에는 매장·고객·대화·매장 직원·예약 데이터가 모두 영구
              삭제됩니다 (복구 불가).
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded bg-black px-5 py-2 text-white disabled:opacity-40"
          >
            {pending ? "취소 중..." : "해지 취소"}
          </button>
          {result && !result.ok && (
            <span className="text-sm text-red-700">{result.message}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="rounded border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="mb-2 font-medium">해지 안내</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>해지 신청 후 30일간 grace 기간이 시작됩니다 (취소 가능).</li>
          <li>grace 기간 동안 매장 인박스/AI 응답은 일시 정지됩니다.</li>
          <li>
            30일 후 매장 모든 데이터(고객·대화·예약·직원·정산)가 영구
            삭제됩니다.
          </li>
          <li>관련 법: 개인정보보호법 §21 (보유기간 경과 후 파기).</li>
        </ul>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">해지 사유 (선택)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="사업 종료, 서비스 불만족 등"
          className="w-full rounded border px-3 py-2"
          maxLength={2000}
        />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>
          30일 grace 종료 후 매장 데이터가 영구 삭제됨을 이해하며, 해지를
          신청합니다.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !confirmed}
          className="rounded bg-red-700 px-5 py-2 text-white disabled:opacity-40"
        >
          {pending ? "신청 중..." : "매장 해지 신청"}
        </button>
        {result && !result.ok && (
          <span className="text-sm text-red-600">{result.message}</span>
        )}
      </div>
    </form>
  );
}
