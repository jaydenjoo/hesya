"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status =
  | "manual_review"
  | "auto_approved"
  | "rejected"
  | "pending"
  | "session_expired";
type Props = { initialStatus: Status; pollMs?: number };

/**
 * Phase 1-β Task B — owner 검토 대기 + 폴링 표시.
 *
 * 30초 간격으로 `/api/store/me/status` 폴링. 'auto_approved' 또는 'rejected'에
 * 도달하면 폴링 중단 (서버에서 다시 manual_review로 돌아갈 일 없음).
 *
 * 401(세션 만료) → 'session_expired' sentinel로 폴링 중단 + sign-in 안내.
 * 그 외 non-ok(5xx)는 silent retry — 다음 인터벌이 처리.
 *
 * 자동 검증 미사용(Phase 1-β scope OUT) → 'auto_approved'는 admin 수동 승인
 * 결과(`approveStore` DAL) 의미. 컬럼 enum 재사용.
 */
export function PendingStatus({ initialStatus, pollMs = 30000 }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    if (
      status === "auto_approved" ||
      status === "rejected" ||
      status === "session_expired"
    )
      return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/store/me/status");
        if (res.status === 401) {
          setStatus("session_expired");
          return;
        }
        if (!res.ok) return; // transient 5xx — 다음 인터벌에서 재시도
        const json = await res.json();
        if (json.ok && json.status) setStatus(json.status as Status);
      } catch {
        // network error — 다음 인터벌에서 재시도. 401은 위에서 별도 처리.
      }
    }, pollMs);
    return () => clearInterval(id);
  }, [status, pollMs]);

  return (
    <div data-testid="pending-status" data-status={status}>
      {status === "manual_review" && (
        <StatusCard
          tone="warn"
          icon="⏱"
          title="검토 중"
          body="24~48시간 내 결과를 알려드립니다."
        />
      )}
      {status === "auto_approved" && (
        <StatusCard
          tone="success"
          icon="✓"
          title="승인됨!"
          body="Instagram 채널 연결로 다음 단계를 진행해주세요."
          cta={
            <Link
              href="/store/inbox/connect"
              className="kr inline-flex items-center justify-center rounded-md bg-hesya-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hesya-amber-600"
            >
              Instagram 연결
            </Link>
          }
        />
      )}
      {status === "rejected" && (
        <StatusCard
          tone="error"
          icon="✕"
          title="거절됨"
          body="사유는 이메일 또는 상담으로 안내드립니다."
        />
      )}
      {status === "pending" && (
        <StatusCard
          tone="neutral"
          icon="…"
          title="대기 중"
          body="잠시 후 다시 확인해주세요."
        />
      )}
      {status === "session_expired" && (
        <StatusCard
          tone="warn"
          icon="!"
          title="세션 만료"
          body="다시 로그인하면 신청 상태를 이어서 확인할 수 있습니다."
          cta={
            <Link
              href="/sign-in"
              className="kr inline-flex items-center justify-center rounded-md border border-hesya-peach-200 bg-white px-4 py-2.5 text-sm font-semibold text-hesya-navy-900 hover:border-hesya-amber-500"
            >
              다시 로그인하세요
            </Link>
          }
        />
      )}
    </div>
  );
}

type Tone = "warn" | "success" | "error" | "neutral";

const TONE_STYLES: Record<Tone, { card: string; icon: string }> = {
  warn: {
    card: "border-hesya-amber-500 bg-hesya-peach-100",
    icon: "bg-hesya-amber-500 text-white",
  },
  success: {
    card: "border-emerald-500 bg-emerald-50",
    icon: "bg-emerald-500 text-white",
  },
  error: {
    card: "border-red-500 bg-red-50",
    icon: "bg-red-500 text-white",
  },
  neutral: {
    card: "border-hesya-peach-200 bg-hesya-peach-50",
    icon: "bg-hesya-peach-200 text-hesya-navy-900",
  },
};

function StatusCard({
  tone,
  icon,
  title,
  body,
  cta,
}: {
  tone: Tone;
  icon: string;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      data-testid="pending-status-card"
      data-tone={tone}
      className={`rounded-2xl border-l-4 p-5 shadow-sm sm:p-6 ${styles.card}`}
    >
      <div className="flex items-start gap-3.5">
        <div
          aria-hidden="true"
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${styles.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="kr text-base font-semibold text-hesya-navy-900">
            {title}
          </h2>
          <p className="kr mt-1 break-keep text-sm leading-relaxed text-gray-700">
            {body}
          </p>
          {cta ? <div className="mt-4">{cta}</div> : null}
        </div>
      </div>
    </div>
  );
}
