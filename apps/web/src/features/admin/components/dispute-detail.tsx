"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Dispute } from "@hesya/database";

import {
  rejectDisputeAction,
  resolveDisputeAction,
  setDisputeInReviewAction,
} from "@/lib/disputes/actions";

import "./dispute-detail.css";

/**
 * Epic 12.4 — admin 분쟁 상세 + 처리 액션.
 * Reference: docs/design/reference/Hesya Admin Disputes Detail.html
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

const STATUS_TONE: Record<string, string> = {
  open: "open",
  sla_exceeded: "sla",
  in_review: "review",
  resolved: "done",
  rejected: "rejected",
};

type Props = {
  dispute: Dispute;
  /** Server-injected — purity 위반 회피 (admin/disputes/[id]/page.tsx). */
  nowMs: number;
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
  if (currentStatus === "rejected" || currentStatus === "sla_exceeded") {
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
  const slaTone = isTerminal
    ? "muted"
    : slaUrgent
      ? "urgent"
      : slaWarn
        ? "warn"
        : "";
  const sevTone = STATUS_TONE[dispute.status] ?? "rejected";

  return (
    <div className="dispute-detail-page">
      <section className="dd-header">
        <div className="dd-header-row">
          <div>
            <h1 className="dd-title">
              <span style={{ fontStyle: "italic" }}>Dispute</span>
              <span className="ko" lang="ko">
                분쟁 상세
              </span>
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <span className={`sev-pill ${sevTone}`} lang="ko">
                {STATUS_LABELS[dispute.status] ?? dispute.status}
              </span>
              <span className="cat-chip" lang="ko">
                {CATEGORY_LABELS[dispute.category] ?? dispute.category}
              </span>
            </div>
            <p className="dd-meta">
              접수 {dispute.createdAt.toISOString().slice(0, 10)} · 매장{" "}
              <code>{dispute.storeId.slice(0, 8)}</code>
            </p>
          </div>
          <div className="sla-box">
            <p className="lab">SLA 마감</p>
            <p className={`v ${slaTone}`}>{slaText}</p>
            <p className="when">
              {dispute.slaDueAt.toISOString().slice(0, 10)}
            </p>
          </div>
        </div>

        <ol className="dd-tl">
          {TIMELINE_STEPS.map((step, i) => {
            const state = timelineState(step, dispute.status);
            return (
              <li key={step} className={`dd-tl-step ${state}`}>
                <span className="dot" aria-hidden="true" />
                <span>
                  {i + 1}. {TIMELINE_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="section" aria-labelledby="meta-h">
        <h2 className="section-h" id="meta-h">
          <span style={{ fontStyle: "italic" }}>Metadata</span>
          <span className="ko" lang="ko">
            메타데이터
          </span>
          <span className="meta">§02 · CONTEXT</span>
        </h2>
        <dl className="meta-grid">
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

      <section className="section" aria-labelledby="desc-h">
        <h2 className="section-h" id="desc-h">
          <span style={{ fontStyle: "italic" }}>Complaint</span>
          <span className="ko" lang="ko">
            신고 내용
          </span>
        </h2>
        <div className="quote-box">
          <span className="party">FILED BY</span>
          {dispute.description}
        </div>
      </section>

      {isTerminal ? (
        <section className="section" aria-labelledby="result-h">
          <h2 className="section-h" id="result-h">
            <span style={{ fontStyle: "italic" }}>Resolution</span>
            <span className="ko" lang="ko">
              처리 결과
            </span>
          </h2>
          <div className="quote-box">
            <span className="party">ADMIN RESOLUTION</span>
            {dispute.resolution ?? "(기록 없음)"}
          </div>
        </section>
      ) : (
        <section className="action-panel" aria-labelledby="action-h">
          <h2 className="section-h" id="action-h" style={{ marginBottom: 12 }}>
            <span style={{ fontStyle: "italic" }}>Resolve</span>
            <span className="ko" lang="ko">
              처리 결정
            </span>
          </h2>
          <label className="field-label" htmlFor="resolution" lang="ko">
            처리 결과 (5자 이상, resolved/rejected 시 사장에게 이메일 발송)
          </label>
          <textarea
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
          />
          <div className="action-row">
            {dispute.status === "open" && (
              <button
                type="button"
                onClick={onSetInReview}
                disabled={pending}
                className="btn btn-ghost"
                lang="ko"
              >
                {pending ? "처리 중..." : "검토 시작"}
              </button>
            )}
            <button
              type="button"
              onClick={onResolve}
              disabled={pending || !resolutionOk}
              className="btn btn-primary"
              lang="ko"
            >
              해결 처리
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={pending || !resolutionOk}
              className="btn btn-ghost"
              lang="ko"
            >
              거절 처리
            </button>
          </div>
        </section>
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
    <div className="meta-cell">
      <dt className="k">{k}</dt>
      <dd className={`v${mono ? " mono" : ""}${muted ? " muted" : ""}`}>{v}</dd>
    </div>
  );
}
