export type WindowState = "no-inbound" | "open" | "closing-soon" | "expired";

export interface WindowStatus {
  state: WindowState;
  remainingMs: number | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * 24시간 메시징 윈도우 상태 계산 (Meta DM 정책).
 *
 * - `no-inbound`: 고객이 아직 메시지 보낸 적 없음
 * - `open`: 1시간 이상 남음
 * - `closing-soon`: 1시간 미만 남음
 * - `expired`: 24시간 경과 — 답변 불가
 */
export function getWindowStatus(expiresAt: Date | null): WindowStatus {
  if (!expiresAt) return { state: "no-inbound" as const, remainingMs: null };
  const remainingMs = expiresAt.getTime() - Date.now();
  if (remainingMs <= 0) return { state: "expired" as const, remainingMs: 0 };
  if (remainingMs < ONE_HOUR_MS)
    return { state: "closing-soon" as const, remainingMs };
  return { state: "open" as const, remainingMs };
}
