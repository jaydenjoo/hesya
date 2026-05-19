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
    <div
      data-testid="pending-status"
      data-status={status}
      className="space-y-4"
    >
      <OnboardingRoadmap status={status} />
      {status === "manual_review" && (
        <StatusCard
          tone="warn"
          icon="⏱"
          title="검토 중"
          body="24~48시간 내 결과를 알려드립니다."
          eta="ETA 24~48h"
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

const ROADMAP_STEPS = ["신청 접수", "검토", "승인", "활성화"] as const;

function OnboardingRoadmap({ status }: { status: Status }) {
  const currentIdx =
    status === "manual_review" || status === "pending"
      ? 1
      : status === "auto_approved"
        ? 3
        : status === "rejected"
          ? 2
          : 1;
  const failed = status === "rejected";
  return (
    <ol
      aria-label="온보딩 진행 단계"
      className="grid grid-cols-4 gap-2 rounded-2xl bg-hesya-peach-50 px-4 py-3"
    >
      {ROADMAP_STEPS.map((label, i) => {
        const done = !failed && i < currentIdx;
        const current = i === currentIdx;
        const tone =
          failed && i === 2
            ? {
                dot: "bg-hesya-danger-600",
                text: "text-hesya-danger-600 font-semibold",
              }
            : done
              ? { dot: "bg-emerald-500", text: "text-emerald-700" }
              : current
                ? {
                    dot: "bg-hesya-amber-500 ring-4 ring-hesya-amber-500/20",
                    text: "text-hesya-amber-600 font-semibold",
                  }
                : {
                    dot: "bg-hesya-navy-900/15",
                    text: "text-hesya-navy-900/45",
                  };
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
            />
            <span className={`kr text-[11.5px] ${tone.text}`}>
              {i + 1}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Tone = "warn" | "success" | "error" | "neutral";

// M6 audit fix: error tone을 admin disputes status pill의 crit token과 일관성 통일.
const TONE_STYLES: Record<
  Tone,
  { card: string; icon: string; pulse: boolean }
> = {
  warn: {
    card: "border-hesya-amber-500 bg-hesya-peach-100",
    icon: "bg-hesya-amber-500 text-white",
    pulse: true,
  },
  success: {
    card: "border-emerald-500 bg-emerald-50",
    icon: "bg-emerald-500 text-white",
    pulse: false,
  },
  error: {
    card: "border-hesya-danger-600 bg-hesya-danger-100",
    icon: "bg-hesya-danger-600 text-white",
    pulse: false,
  },
  neutral: {
    card: "border-hesya-peach-200 bg-hesya-peach-50",
    icon: "bg-hesya-peach-200 text-hesya-navy-900",
    pulse: true,
  },
};

function StatusCard({
  tone,
  icon,
  title,
  body,
  cta,
  eta,
}: {
  tone: Tone;
  icon: string;
  title: string;
  body: string;
  cta?: React.ReactNode;
  /** 예상 처리 시간 chip (예: "ETA 24~48h"). */
  eta?: string;
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
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${styles.pulse ? "motion-safe:animate-pulse" : ""} ${styles.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="kr text-base font-semibold text-hesya-navy-900">
              {title}
            </h2>
            {eta && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-hesya-amber-700 ring-1 ring-hesya-amber-500/30">
                {eta}
              </span>
            )}
          </div>
          <p className="kr mt-1 break-keep text-sm leading-relaxed text-gray-700">
            {body}
          </p>
          {cta ? <div className="mt-4">{cta}</div> : null}
        </div>
      </div>
    </div>
  );
}
