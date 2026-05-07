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
    <div className="max-w-lg">
      {status === "manual_review" && (
        <p>검토 중 — 24~48시간 내 결과를 알려드립니다.</p>
      )}
      {status === "auto_approved" && (
        <p>
          승인됨!{" "}
          <Link href="/store/inbox/connect" className="underline">
            Instagram 연결
          </Link>
          으로 진행하세요.
        </p>
      )}
      {status === "rejected" && (
        <p>거절됨. 사유는 메일 또는 상담으로 안내드립니다.</p>
      )}
      {status === "pending" && <p>대기 중...</p>}
      {status === "session_expired" && (
        <p>
          세션 만료.{" "}
          <Link href="/sign-in" className="underline">
            다시 로그인하세요
          </Link>
          .
        </p>
      )}
    </div>
  );
}
