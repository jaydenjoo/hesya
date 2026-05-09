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

type Props = { dispute: Dispute };

export function DisputeDetail({ dispute }: Props) {
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

  return (
    <div className="max-w-2xl space-y-6">
      <dl className="space-y-2">
        <Row k="상태" v={STATUS_LABELS[dispute.status] ?? dispute.status} />
        <Row
          k="유형"
          v={CATEGORY_LABELS[dispute.category] ?? dispute.category}
        />
        <Row k="매장 ID" v={dispute.storeId} />
        <Row k="신고자 user_id" v={dispute.filedByUserId ?? "-"} />
        <Row k="대화 ID" v={dispute.conversationId ?? "(연결 없음)"} />
        <Row k="접수일" v={dispute.createdAt.toISOString().slice(0, 19)} />
        <Row k="SLA 마감" v={dispute.slaDueAt.toISOString().slice(0, 19)} />
        {dispute.resolvedAt && (
          <Row k="처리일" v={dispute.resolvedAt.toISOString().slice(0, 19)} />
        )}
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">신고 내용</h2>
        <p className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-sm">
          {dispute.description}
        </p>
      </section>

      {isTerminal ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">처리 결과</h2>
          <p className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-sm">
            {dispute.resolution ?? "(기록 없음)"}
          </p>
        </section>
      ) : (
        <div className="space-y-3 rounded border p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              처리 결과 (5자 이상, resolved/rejected 시 사장에게 이메일 발송)
            </span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full rounded border px-3 py-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {dispute.status === "open" && (
              <button
                type="button"
                onClick={onSetInReview}
                disabled={pending}
                className="rounded border px-4 py-2 disabled:opacity-40"
              >
                {pending ? "처리 중..." : "검토 시작"}
              </button>
            )}
            <button
              type="button"
              onClick={onResolve}
              disabled={pending || !resolutionOk}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
            >
              해결 처리
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={pending || !resolutionOk}
              className="rounded border px-4 py-2 disabled:opacity-40"
            >
              거절 처리
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 font-medium">{k}</dt>
      <dd className="break-all">{v}</dd>
    </div>
  );
}
