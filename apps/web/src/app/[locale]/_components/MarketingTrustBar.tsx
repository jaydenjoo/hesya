"use client";

import { useEffect, useRef, useState } from "react";

type StatNum = { value: number; decimals: number; suffix?: string };

type Stat =
  | { icon: string; kind: "ratingBookings"; nums: [StatNum, StatNum] }
  | { icon: string; kind: "salons"; num: StatNum }
  | { icon: string; kind: "text"; text: string };

const STATS: Stat[] = [
  {
    icon: "⭐",
    kind: "ratingBookings",
    nums: [
      { value: 4.92, decimals: 2 },
      { value: 12847, decimals: 0, suffix: "+" },
    ],
  },
  {
    icon: "🇰🇷",
    kind: "salons",
    num: { value: 1284, decimals: 0 },
  },
  {
    icon: "🗣️",
    kind: "text",
    text: "5 languages — KR · EN · 日本語 · 中文 · Tiếng Việt",
  },
  {
    icon: "🛡️",
    kind: "text",
    text: "Tier 2 Safe Country (CEOWORLD 2026)",
  },
  {
    icon: "💬",
    kind: "text",
    text: "24/7 chat support in your language",
  },
];

const ANIM_DURATION_MS = 1400;

function formatNum(n: number, decimals: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function AnimatedNum({
  target,
  decimals,
  suffix,
  start,
}: {
  target: number;
  decimals: number;
  suffix?: string;
  start: boolean;
}) {
  const [display, setDisplay] = useState<string>(formatNum(0, decimals));

  useEffect(() => {
    if (!start) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduced ? 0 : ANIM_DURATION_MS;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      if (duration === 0) {
        setDisplay(formatNum(target, decimals));
        return;
      }
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(formatNum(target * eased, decimals));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, decimals]);

  return (
    <span className="font-heading text-[18px] italic font-semibold tracking-tight text-hesya-amber-700">
      {display}
      {suffix}
    </span>
  );
}

export function MarketingTrustBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.3) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [started]);

  return (
    <aside
      ref={ref}
      aria-label="Trust stats"
      className="bg-hesya-peach-100 px-6 py-7"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3.5 text-[13.5px] text-hesya-navy-900">
        {STATS.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span aria-hidden="true">{s.icon}</span>
            {s.kind === "ratingBookings" ? (
              <>
                <AnimatedNum
                  target={s.nums[0].value}
                  decimals={s.nums[0].decimals}
                  start={started}
                />{" "}
                avg rating ·{" "}
                <AnimatedNum
                  target={s.nums[1].value}
                  decimals={s.nums[1].decimals}
                  suffix={s.nums[1].suffix}
                  start={started}
                />{" "}
                bookings
              </>
            ) : null}
            {s.kind === "salons" ? (
              <>
                <AnimatedNum
                  target={s.num.value}
                  decimals={s.num.decimals}
                  start={started}
                />{" "}
                K-Verified salons
              </>
            ) : null}
            {s.kind === "text" ? <span>{s.text}</span> : null}
            {i < STATS.length - 1 ? (
              <span
                aria-hidden="true"
                className="hidden text-[11px] text-hesya-navy-700 sm:inline"
              >
                ·
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </aside>
  );
}
