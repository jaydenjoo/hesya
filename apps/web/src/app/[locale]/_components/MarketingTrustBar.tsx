"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const ANIM_DURATION_MS = 1400;

const NUMS = {
  rating: { value: 4.92, decimals: 2 },
  bookings: { value: 12847, decimals: 0, suffix: "+" },
  salons: { value: 1284, decimals: 0 },
};

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
  const t = useTranslations("MarketingLanding");
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

  const sep = (
    <span
      aria-hidden="true"
      className="hidden text-[11px] text-hesya-navy-700 sm:inline"
    >
      ·
    </span>
  );

  return (
    <aside
      ref={ref}
      aria-label="Trust stats"
      className="bg-hesya-peach-100 px-6 py-7"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3.5 text-[13.5px] text-hesya-navy-900">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">⭐</span>
          <AnimatedNum
            target={NUMS.rating.value}
            decimals={NUMS.rating.decimals}
            start={started}
          />{" "}
          {t("trustBarAvgRating")} ·{" "}
          <AnimatedNum
            target={NUMS.bookings.value}
            decimals={NUMS.bookings.decimals}
            suffix={NUMS.bookings.suffix}
            start={started}
          />{" "}
          {t("trustBarBookings")}
        </span>
        {sep}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">🇰🇷</span>
          <AnimatedNum
            target={NUMS.salons.value}
            decimals={NUMS.salons.decimals}
            start={started}
          />{" "}
          {t("trustBarKVerifiedSalons")}
        </span>
        {sep}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">🗣️</span>
          <span>{t("trustBarLangs")}</span>
        </span>
        {sep}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">🛡️</span>
          <span>{t("trustBarSafeCountry")}</span>
        </span>
        {sep}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">💬</span>
          <span>{t("trustBarChat")}</span>
        </span>
      </div>
    </aside>
  );
}
