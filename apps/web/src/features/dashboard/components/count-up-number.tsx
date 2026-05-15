"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reference 정합 PR 7 — useCountUp 애니메이션 컴포넌트.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:5-24` `useCountUp`.
 * - 350ms ease-out-cubic
 * - sessionStorage로 페이지 진입 1회만 (새로고침 시 재실행)
 * - `prefers-reduced-motion: reduce` 존중 — 즉시 target 표시
 *
 * 큰 숫자 (TileBookings count, KPI 값 등)를 0 → target 로 부드럽게 카운트업.
 */

interface Props {
  /** 최종 표시할 정수 */
  readonly value: number;
  /** 애니메이션 지속 시간 (ms). 기본 350. */
  readonly durationMs?: number;
  /** 한 번만 실행되도록 sessionStorage에 사용할 키 (선택). 동일 키는 1회만. */
  readonly storageKey?: string;
  /** 숫자 앞 prefix (e.g., "₩"). */
  readonly prefix?: string;
  /** 숫자 뒤 suffix (e.g., "%"). */
  readonly suffix?: string;
  /** locale (toLocaleString 용). 기본 "ko". */
  readonly locale?: string;
  readonly className?: string;
}

export function CountUpNumber({
  value,
  durationMs = 350,
  storageKey,
  prefix = "",
  suffix = "",
  locale = "ko",
  className,
}: Props) {
  // SSR / hydration 호환을 위해 초기값은 0. useEffect에서 즉시 target/애니메이션
  // 으로 전환. reference (`dashboard-app.jsx:5-24`) 패턴 동일.
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cached = !!(storageKey && window.sessionStorage.getItem(storageKey));

    // reduced-motion or sessionStorage hit → 즉시 target 표시 (애니메이션 skip).
    if (reduce || cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bounded one-time jump to target, no cascading render
      setDisplay(value);
      return;
    }

    if (storageKey) {
      window.sessionStorage.setItem(storageKey, "1");
    }

    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, storageKey]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString(locale)}
      {suffix}
    </span>
  );
}
