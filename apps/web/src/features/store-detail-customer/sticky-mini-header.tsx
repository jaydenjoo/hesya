"use client";

/**
 * Plan v3 Phase D2-B2-a — Sticky mini header.
 *
 * 손님이 hero를 스크롤로 통과하면 fade-in되어 상단 고정. 매장명 + Book CTA.
 * sentinel element를 hero 아래에 두고 IntersectionObserver로 가시성 감지.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

interface Props {
  readonly storeName: string;
  readonly bookHref: string;
  readonly bookLabel: string;
  readonly rating?: number | null;
  readonly onBack?: () => void;
  readonly backLabel?: string;
}

export function StickyMiniHeader({
  storeName,
  bookHref,
  bookLabel,
  rating,
  onBack,
  backLabel,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      <div
        aria-hidden={!visible}
        className={[
          "sticky top-0 z-30 flex items-center gap-2 border-b border-hesya-peach-200 bg-hesya-peach-50/95 px-3 py-2 backdrop-blur transition-opacity",
          visible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {onBack && (
          <button
            type="button"
            aria-label={backLabel ?? "Back"}
            onClick={onBack}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-hesya-navy-900 backdrop-blur-sm transition hover:bg-white"
          >
            <span aria-hidden="true" className="text-[15px] leading-none">
              ←
            </span>
          </button>
        )}
        <span
          aria-hidden="true"
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-hesya-peach-200 to-hesya-amber-600 font-heading text-[12px] font-semibold italic text-white"
        >
          {(storeName.charAt(0) || "?").toUpperCase()}
        </span>
        <p className="min-w-0 flex-1 truncate font-heading text-[14px] font-semibold italic text-hesya-navy-900">
          {storeName}
        </p>
        {rating != null && rating > 0 && (
          <span className="mono inline-flex items-center gap-0.5 flex-shrink-0 text-[11.5px] font-semibold text-hesya-navy-900/85">
            <span aria-hidden="true" className="text-hesya-amber-600">
              ★
            </span>
            {rating.toFixed(2)}
          </span>
        )}
        <Link
          href={bookHref}
          className="flex-shrink-0 rounded-full bg-hesya-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(232,169,122,0.35)] transition hover:bg-hesya-amber-600"
        >
          {bookLabel} →
        </Link>
      </div>
    </>
  );
}
