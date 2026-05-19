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
  /** purge 완료 후 NULL — store_name_snapshot으로 라벨만 보존 */
  storeId: string | null;
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
  /** Server-injected `Date.now()` at render time — pure render. */
  nowMs: number;
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
  owner: "bg-hesya-peach-100 text-hesya-navy-900 border-hesya-peach-200",
  admin: "bg-hesya-danger-100 text-hesya-danger-600 border-hesya-danger-200",
};

function daysUntil(target: Date, from = new Date()): number {
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function AdminDeletionQueue({
  rows,
  filter,
  locale,
  nowMs,
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
      <section className="rounded-2xl border border-hesya-danger-200 bg-white p-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ring-1 ring-inset ring-hesya-danger-200">
        <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-danger-600">
          §01 · Force Deletion
        </p>
        <h2 className="mb-2 font-display text-[20px] italic tracking-tight text-hesya-navy-900">
          강제 해지
        </h2>
        <p className="mb-4 text-[12.5px] text-hesya-navy-900/75 [word-break:keep-all]">
          약관 위반 등 사유로 매장을 강제 해지합니다. 30일 grace 후 cron이 자동
          cascade hard-delete.
        </p>
        <form onSubmit={onForceSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-hesya-navy-900">
              매장 ID (UUID)
            </span>
            <input
              type="text"
              value={forceStoreId}
              onChange={(e) => setForceStoreId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full max-w-md rounded-md border border-hesya-peach-200 bg-white px-3 py-2 font-mono text-sm focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-hesya-navy-900">
              사유 (필수)
            </span>
            <textarea
              value={forceReason}
              onChange={(e) => setForceReason(e.target.value)}
              rows={3}
              placeholder="예: 마사지·스파 영업 적발 (PRD §948 의료법 88조 1호)"
              className="w-full max-w-2xl rounded-md border border-hesya-peach-200 bg-white px-3 py-2 focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
              minLength={1}
              maxLength={2000}
              required
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || !forceStoreId.trim() || !forceReason.trim()}
              className="rounded-md bg-hesya-danger-600 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-danger-700 disabled:opacity-40"
            >
              {pending && !actingRowId ? "신청 중..." : "강제 해지 신청"}
            </button>
            {result && !result.ok && !actingRowId && (
              <span className="text-[12px] text-hesya-danger-600">
                {result.message}
              </span>
            )}
            {result && result.ok && !actingRowId && (
              <span className="text-sm text-emerald-700">완료</span>
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
                className={`rounded-md border px-3 py-1 transition-colors ${
                  filter === f
                    ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                    : "border-gray-200 bg-white text-hesya-navy-900 hover:border-hesya-navy-900"
                }`}
              >
                {FILTER_LABELS[f]}
              </a>
            ),
          )}
        </nav>

        {rows.length === 0 ? (
          <p className="text-sm text-hesya-navy-900/60">
            해당 상태의 요청이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-hesya-peach-100 rounded-md border border-hesya-peach-100 bg-white">
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
                <li
                  key={row.id}
                  className="space-y-2 p-4 transition-colors hover:bg-hesya-peach-50/40"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-hesya-navy-900">
                      {row.storeName}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs ${sourceColor}`}
                    >
                      {sourceLabel}
                    </span>
                    {remaining !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums ${
                          remaining <= 7
                            ? "bg-hesya-danger-100 text-hesya-danger-600"
                            : remaining <= 14
                              ? "bg-hesya-peach-100 text-hesya-amber-600"
                              : "bg-hesya-peach-50 text-hesya-navy-900/70"
                        }`}
                      >
                        D-{Math.max(0, remaining)}일
                      </span>
                    )}
                    {row.purgedAt && (
                      <span className="rounded-md border border-hesya-peach-200 bg-hesya-peach-50 px-2 py-0.5 text-xs text-hesya-navy-900/70">
                        삭제 완료
                      </span>
                    )}
                    {row.cancelledAt && (
                      <span className="rounded-md border border-hesya-peach-200 bg-hesya-peach-50 px-2 py-0.5 text-xs text-hesya-navy-900/70">
                        취소됨
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-hesya-peach-100 bg-hesya-peach-100 text-[12px] sm:grid-cols-3">
                    <MetaCell k="requested by" v={row.requestedByEmail} />
                    <MetaCell
                      k="scheduled purge"
                      v={purgeAt.toLocaleDateString("ko-KR")}
                      mono
                    />
                    <MetaCell
                      k="store id"
                      v={row.storeId ?? "(purged)"}
                      mono={Boolean(row.storeId)}
                      muted={!row.storeId}
                    />
                  </dl>
                  {!row.cancelledAt && !row.purgedAt && (
                    <GraceBar
                      createdAt={new Date(row.createdAt)}
                      purgeAt={purgeAt}
                      nowMs={nowMs}
                    />
                  )}
                  {row.reason && (
                    <p className="rounded-md border border-hesya-peach-100 bg-hesya-peach-50/60 px-3 py-2 text-[12.5px] text-hesya-navy-900/85 [word-break:keep-all]">
                      <span className="mr-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-amber-600">
                        reason
                      </span>
                      {row.reason}
                    </p>
                  )}
                  {!row.cancelledAt && !row.purgedAt && row.storeId && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onCancelRow(row.storeId!, row.id)}
                        disabled={pending}
                        className="rounded-md border border-hesya-peach-200 bg-white px-3 py-1 text-sm text-hesya-navy-900 transition-colors hover:border-hesya-navy-900 disabled:opacity-40"
                      >
                        {pending && actingRowId === row.id
                          ? "취소 중..."
                          : "해지 취소"}
                      </button>
                      {result && actingRowId === row.id && !result.ok && (
                        <span className="text-[12px] text-hesya-danger-600">
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

function MetaCell({
  k,
  v,
  mono = false,
  muted = false,
}: {
  k: string;
  v: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-white px-3 py-2">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
        {k}
      </dt>
      <dd
        className={`${mono ? "font-mono text-[11.5px]" : "text-[12.5px]"} break-all ${muted ? "text-hesya-navy-900/55" : "text-hesya-navy-900"}`}
      >
        {v}
      </dd>
    </div>
  );
}

function GraceBar({
  createdAt,
  purgeAt,
  nowMs,
}: {
  createdAt: Date;
  purgeAt: Date;
  nowMs: number;
}) {
  const total = purgeAt.getTime() - createdAt.getTime();
  const elapsed = nowMs - createdAt.getTime();
  const pct =
    total <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));
  const danger = pct >= 75;
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
        grace
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-hesya-peach-50">
        <div
          className={`h-full ${danger ? "bg-hesya-danger-600" : "bg-hesya-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10.5px] tabular-nums text-hesya-navy-900/60">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
