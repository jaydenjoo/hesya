"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  cancelAdminStoreDeletionAction,
  requestAdminStoreDeletionAction,
  type AdminDeletionResult,
} from "@/lib/store-deletion/actions";

/**
 * E12-9 — admin 매장 해지 큐 (PRD §1068, SLA 30일 grace).
 *
 * 큐: pending(grace 진행) / expired(30일 경과 미실행 — cron 대기) / cancelled / purged.
 * admin 강제해지 폼(상단) + 행 단위 취소 버튼.
 */
export interface AdminDeletionRow {
  id: string;
  storeId: string;
  storeName: string;
  source: "owner" | "admin" | string;
  requestedByEmail: string;
  reason: string | null;
  scheduledPurgeAt: string;
  cancelledAt: string | null;
  cancelledByEmail: string | null;
  purgedAt: string | null;
  createdAt: string;
}

export interface AdminDeletionQueueProps {
  rows: AdminDeletionRow[];
  filter: "pending" | "expired" | "cancelled" | "purged" | "all";
  locale: string;
}

const FILTER_LABELS: Record<AdminDeletionQueueProps["filter"], string> = {
  pending: "진행 중 (grace)",
  expired: "30일 경과 (cron 대기)",
  cancelled: "취소됨",
  purged: "삭제 완료",
  all: "전체",
};

const SOURCE_LABELS: Record<string, string> = {
  owner: "사장 자가해지",
  admin: "운영자 강제해지",
};

const SOURCE_BADGE_COLORS: Record<string, string> = {
  owner: "bg-blue-100 text-blue-900 border-blue-300",
  admin: "bg-red-100 text-red-900 border-red-300",
};

function daysUntil(target: Date, from = new Date()): number {
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function AdminDeletionQueue({
  rows,
  filter,
  locale,
}: AdminDeletionQueueProps) {
  const router = useRouter();
  const [forceStoreId, setForceStoreId] = useState("");
  const [forceReason, setForceReason] = useState("");
  const [result, setResult] = useState<AdminDeletionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [actingRowId, setActingRowId] = useState<string | null>(null);

  const onForceSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    setActingRowId(null);
    startTransition(async () => {
      const res = await requestAdminStoreDeletionAction({
        storeId: forceStoreId.trim(),
        reason: forceReason.trim(),
      });
      setResult(res);
      if (res.ok) {
        setForceStoreId("");
        setForceReason("");
        router.refresh();
      }
    });
  };

  const onCancelRow = (storeId: string, rowId: string) => {
    setResult(null);
    setActingRowId(rowId);
    startTransition(async () => {
      const res = await cancelAdminStoreDeletionAction({ storeId });
      setResult(res);
      if (res.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded border border-red-300 bg-red-50 p-6">
        <h2 className="mb-3 text-lg font-bold text-red-900">강제 해지</h2>
        <p className="mb-4 text-sm text-red-800">
          약관 위반 등 사유로 매장을 강제 해지합니다. 30일 grace 후 cron이 자동
          cascade hard-delete.
        </p>
        <form onSubmit={onForceSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              매장 ID (UUID)
            </span>
            <input
              type="text"
              value={forceStoreId}
              onChange={(e) => setForceStoreId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full max-w-md rounded border px-3 py-2 font-mono text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">사유 (필수)</span>
            <textarea
              value={forceReason}
              onChange={(e) => setForceReason(e.target.value)}
              rows={3}
              placeholder="예: 마사지·스파 영업 적발 (PRD §948 의료법 88조 1호)"
              className="w-full max-w-2xl rounded border px-3 py-2"
              minLength={1}
              maxLength={2000}
              required
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || !forceStoreId.trim() || !forceReason.trim()}
              className="rounded bg-red-700 px-5 py-2 text-white disabled:opacity-40"
            >
              {pending && !actingRowId ? "신청 중..." : "강제 해지 신청"}
            </button>
            {result && !result.ok && !actingRowId && (
              <span className="text-sm text-red-700">{result.message}</span>
            )}
            {result && result.ok && !actingRowId && (
              <span className="text-sm text-green-700">완료</span>
            )}
          </div>
        </form>
      </section>

      <section>
        <nav className="mb-4 flex flex-wrap gap-2 text-sm">
          {(["pending", "expired", "cancelled", "purged", "all"] as const).map(
            (f) => (
              <a
                key={f}
                href={`/${locale}/admin/store-deletion?status=${f}`}
                className={`rounded border px-3 py-1 ${
                  filter === f
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {FILTER_LABELS[f]}
              </a>
            ),
          )}
        </nav>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">해당 상태의 요청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {rows.map((row) => {
              const purgeAt = new Date(row.scheduledPurgeAt);
              const remaining = row.purgedAt
                ? null
                : row.cancelledAt
                  ? null
                  : daysUntil(purgeAt);
              const sourceColor =
                SOURCE_BADGE_COLORS[row.source] ??
                "bg-gray-100 text-gray-700 border-gray-300";
              const sourceLabel = SOURCE_LABELS[row.source] ?? row.source;
              return (
                <li key={row.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold">{row.storeName}</span>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${sourceColor}`}
                    >
                      {sourceLabel}
                    </span>
                    {remaining !== null && (
                      <span className="text-xs text-gray-500">
                        D-{Math.max(0, remaining)}일
                      </span>
                    )}
                    {row.purgedAt && (
                      <span className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        삭제 완료
                      </span>
                    )}
                    {row.cancelledAt && (
                      <span className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        취소됨
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    <span>요청자: {row.requestedByEmail}</span>
                    <span className="mx-2">·</span>
                    <span>
                      예정 삭제일: {purgeAt.toLocaleDateString("ko-KR")}
                    </span>
                    <span className="mx-2">·</span>
                    <span className="font-mono">{row.storeId}</span>
                  </div>
                  {row.reason && (
                    <p className="text-sm text-gray-700">사유: {row.reason}</p>
                  )}
                  {!row.cancelledAt && !row.purgedAt && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onCancelRow(row.storeId, row.id)}
                        disabled={pending}
                        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-40"
                      >
                        {pending && actingRowId === row.id
                          ? "취소 중..."
                          : "해지 취소"}
                      </button>
                      {result && actingRowId === row.id && !result.ok && (
                        <span className="text-sm text-red-700">
                          {result.message}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
