"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Dispute } from "@hesya/database";

import {
  rejectDisputeAction,
  resolveDisputeAction,
  setDisputeInReviewAction,
} from "@/lib/disputes/actions";

/**
 * Epic 12.4 — admin 분쟁 상세 + 처리 액션.
 *
 * 상태 머신:
 *   open → in_review (검토 시작)
 *   open / in_review → resolved (해결, resolution 5자 이상)
 *   open / in_review → rejected (거절, resolution 5자 이상)
 *
 * 알림은 backend Server Action(`finalizeDispute`)이 자동 발송 (terminal 1회).
 */
const STATUS_LABELS: Record<string, string> = {
  open: "접수",
  in_review: "검토 중",
  resolved: "해결됨",
  rejected: "거절됨",
  sla_exceeded: "SLA 초과",
};

const CATEGORY_LABELS: Record<string, string> = {
  no_show: "노쇼",
  refund: "환불",
  complaint: "일반 컴플레인",
};

type Props = {
  dispute: Dispute;
  /** Server-injected — purity 위반 회피 (admin/disputes/[id]/page.tsx). */
  nowMs: number;
};

const STATUS_TONE: Record<string, { chip: string; dot: string; ring: string }> =
  {
    open: {
      chip: "bg-hesya-danger-100 text-hesya-danger-600",
      dot: "bg-hesya-danger-600",
      ring: "ring-hesya-danger-200",
    },
    sla_exceeded: {
      chip: "bg-hesya-danger-100 text-hesya-danger-600",
      dot: "bg-hesya-danger-600",
      ring: "ring-hesya-danger-200",
    },
    in_review: {
      chip: "bg-hesya-peach-100 text-hesya-amber-600",
      dot: "bg-hesya-amber-500",
      ring: "ring-hesya-peach-200",
    },
    resolved: {
      chip: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      ring: "ring-emerald-200",
    },
    rejected: {
      chip: "bg-gray-100 text-gray-700",
      dot: "bg-gray-400",
      ring: "ring-gray-200",
    },
  };

const TIMELINE_STEPS = ["open", "in_review", "resolved"] as const;
const TIMELINE_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  open: "접수",
  in_review: "검토",
  resolved: "처리",
};

function timelineState(
  step: (typeof TIMELINE_STEPS)[number],
  currentStatus: string,
): "done" | "current" | "todo" {
  if (currentStatus === "rejected") {
    if (step === "open" || step === "in_review") return "done";
    return "todo";
  }
  if (currentStatus === "sla_exceeded") {
    if (step === "open" || step === "in_review") return "done";
    return "todo";
  }
  const order = ["open", "in_review", "resolved"];
  const cur = order.indexOf(currentStatus);
  const idx = order.indexOf(step);
  if (cur === -1) return "todo";
  if (idx < cur) return "done";
  if (idx === cur) return "current";
  return "todo";
}

export function DisputeDetail({ dispute, nowMs }: Props) {
  const router = useRouter();
  const [resolution, setResolution] = useState(dispute.resolution ?? "");
  const [pending, startTransition] = useTransition();

  const isTerminal =
    dispute.status === "resolved" ||
    dispute.status === "rejected" ||
    dispute.status === "sla_exceeded";
  const resolutionOk = resolution.trim().length >= 5;

  const onSetInReview = () => {
    startTransition(async () => {
      const res = await setDisputeInReviewAction({ disputeId: dispute.id });
      if (res.ok) {
        router.refresh();
      } else {
        alert(`상태 변경 실패: ${res.message}`);
      }
    });
  };

  const onResolve = () => {
    startTransition(async () => {
      const res = await resolveDisputeAction({
        disputeId: dispute.id,
        resolution: resolution.trim(),
      });
      if (res.ok) {
        router.push("/admin/disputes");
        router.refresh();
      } else {
        alert(`해결 처리 실패: ${res.message}`);
      }
    });
  };

  const onReject = () => {
    startTransition(async () => {
      const res = await rejectDisputeAction({
        disputeId: dispute.id,
        resolution: resolution.trim(),
      });
      if (res.ok) {
        router.push("/admin/disputes");
        router.refresh();
      } else {
        alert(`거절 처리 실패: ${res.message}`);
      }
    });
  };

  const slaMs = dispute.slaDueAt.getTime() - nowMs;
  const slaDays = Math.ceil(slaMs / (1000 * 60 * 60 * 24));
  const slaUrgent = slaMs < 0;
  const slaWarn = !slaUrgent && slaDays <= 1;
  const slaText = isTerminal
    ? "—"
    : slaUrgent
      ? `초과 ${Math.abs(slaDays)}일`
      : `D-${slaDays}`;
  const statusTone = STATUS_TONE[dispute.status] ?? STATUS_TONE.rejected!;

  return (
    <div className="max-w-2xl space-y-6">
      <section
        className={`rounded-lg border bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ring-1 ring-inset ${statusTone.ring}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${statusTone.chip}`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 rounded-full ${statusTone.dot}`}
                />
                {STATUS_LABELS[dispute.status] ?? dispute.status}
              </span>
              <span className="rounded-full bg-hesya-peach-100 px-2.5 py-0.5 text-[11px] font-semibold text-hesya-navy-900/80">
                {CATEGORY_LABELS[dispute.category] ?? dispute.category}
              </span>
            </div>
            <p className="font-mono text-[11px] text-hesya-navy-900/55">
              접수 {dispute.createdAt.toISOString().slice(0, 10)} · 매장{" "}
              <code className="text-hesya-navy-900/75">
                {dispute.storeId.slice(0, 8)}
              </code>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/55">
              SLA 마감
            </p>
            <p
              className={[
                "mt-1 font-mono text-[20px] font-bold tabular-nums",
                isTerminal
                  ? "text-hesya-navy-900/40"
                  : slaUrgent
                    ? "text-hesya-danger-600"
                    : slaWarn
                      ? "text-hesya-amber-600"
                      : "text-hesya-navy-900",
              ].join(" ")}
            >
              {slaText}
            </p>
            <p className="font-mono text-[10px] text-hesya-navy-900/45">
              {dispute.slaDueAt.toISOString().slice(0, 10)}
            </p>
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-3 gap-2">
          {TIMELINE_STEPS.map((step, i) => {
            const state = timelineState(step, dispute.status);
            const stepStyles = {
              done: { dot: "bg-emerald-500", text: "text-emerald-700" },
              current: {
                dot: "bg-hesya-amber-500 ring-4 ring-hesya-amber-500/20",
                text: "text-hesya-amber-600 font-semibold",
              },
              todo: { dot: "bg-gray-300", text: "text-gray-500" },
            }[state];
            return (
              <li key={step} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${stepStyles.dot}`}
                />
                <span className={`text-[11.5px] ${stepStyles.text}`}>
                  {i + 1}. {TIMELINE_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-3">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §02 · Metadata
        </p>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-hesya-peach-100 bg-hesya-peach-100 text-[12.5px] sm:grid-cols-2">
          <MetaCell k="매장 ID" v={dispute.storeId} mono />
          <MetaCell k="신고자 user_id" v={dispute.filedByUserId ?? "—"} mono />
          <MetaCell
            k="대화 ID"
            v={dispute.conversationId ?? "(연결 없음)"}
            mono={Boolean(dispute.conversationId)}
            muted={!dispute.conversationId}
          />
          <MetaCell
            k="접수일"
            v={dispute.createdAt.toISOString().slice(0, 19).replace("T", " ")}
            mono
          />
          <MetaCell
            k="SLA 마감"
            v={dispute.slaDueAt.toISOString().slice(0, 19).replace("T", " ")}
            mono
          />
          {dispute.resolvedAt && (
            <MetaCell
              k="처리일"
              v={dispute.resolvedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")}
              mono
            />
          )}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-hesya-navy-900">신고 내용</h2>
        <p className="whitespace-pre-wrap rounded-md border border-hesya-peach-100 bg-hesya-peach-50/60 p-3 text-sm">
          {dispute.description}
        </p>
      </section>

      {isTerminal ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-hesya-navy-900">처리 결과</h2>
          <p className="whitespace-pre-wrap rounded-md border border-hesya-peach-100 bg-hesya-peach-50/60 p-3 text-sm">
            {dispute.resolution ?? "(기록 없음)"}
          </p>
        </section>
      ) : (
        <div className="space-y-3 rounded-md border border-hesya-peach-200 bg-hesya-peach-50/40 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-hesya-navy-900">
              처리 결과 (5자 이상, resolved/rejected 시 사장에게 이메일 발송)
            </span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {dispute.status === "open" && (
              <button
                type="button"
                onClick={onSetInReview}
                disabled={pending}
                className="rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-hesya-navy-900 transition-colors hover:border-hesya-navy-900 disabled:opacity-40"
              >
                {pending ? "처리 중..." : "검토 시작"}
              </button>
            )}
            <button
              type="button"
              onClick={onResolve}
              disabled={pending || !resolutionOk}
              className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-40"
            >
              해결 처리
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={pending || !resolutionOk}
              className="rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-hesya-navy-900 transition-colors hover:border-hesya-navy-900 disabled:opacity-40"
            >
              거절 처리
            </button>
          </div>
        </div>
      )}
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
    <div className="flex flex-col gap-1 bg-white px-3 py-2.5">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
        {k}
      </dt>
      <dd
        className={[
          "break-all text-[12.5px]",
          mono ? "font-mono" : "kr",
          muted ? "text-hesya-navy-900/45" : "text-hesya-navy-900",
        ].join(" ")}
      >
        {v}
      </dd>
    </div>
  );
}
