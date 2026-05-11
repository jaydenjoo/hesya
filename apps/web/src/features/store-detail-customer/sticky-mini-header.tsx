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
}

export function StickyMiniHeader({ storeName, bookHref, bookLabel }: Props) {
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
          "sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-hesya-peach-200 bg-hesya-peach-50/95 px-4 py-2.5 backdrop-blur transition-opacity",
          visible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <p className="font-heading text-base font-semibold italic tracking-tight text-hesya-navy-900 truncate">
          {storeName}
        </p>
        <Link
          href={bookHref}
          className="flex-shrink-0 rounded-full bg-hesya-navy-900 px-3.5 py-1.5 text-[11px] font-semibold text-hesya-peach-50 hover:bg-hesya-navy-900/90"
        >
          {bookLabel} →
        </Link>
      </div>
    </>
  );
}
