"use client";

/**
 * Plan v3 Phase D2-B2-a — 매장 상세 hero 갤러리.
 *
 * 가로 scroll-snap + dot indicator. 사진 없으면 amber→peach 그라데이션
 * placeholder. 사진 1장이면 dot 숨김.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  readonly photos: ReadonlyArray<string>;
  readonly placeholderLabel: string;
}

export function HeroGallery({ photos, placeholderLabel }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handler = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActiveIdx(idx);
    };
    track.addEventListener("scroll", handler, { passive: true });
    return () => track.removeEventListener("scroll", handler);
  }, []);

  if (photos.length === 0) {
    return (
      <div className="relative h-[280px] w-full overflow-hidden lg:h-[320px]">
        <div className="absolute inset-0 bg-gradient-to-br from-hesya-amber-500/30 via-hesya-peach-200 to-hesya-peach-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-[60px] italic text-hesya-navy-900/15">
            ◐
          </span>
        </div>
        <span className="sr-only">{placeholderLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex h-[280px] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth lg:h-[320px]"
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className="h-full w-full flex-shrink-0 snap-center object-cover"
            width="440"
            height="320"
          />
        ))}
      </div>
      {photos.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 rounded-full transition-all",
                i === activeIdx ? "w-4 bg-white" : "bg-white/55",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
