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
  /**
   * 사진 0건 매장에 대한 데모용 fallback 이미지 URL.
   * 베타 5곳 매장이 사진 업로드하기 전까지 외부 손님이 빈 그라데이션을
   * 보지 않도록 demo image 1장 제공. fallback URL 로드 실패 시 그라데이션으로 fall through.
   */
  readonly fallbackImageUrl?: string;
  /** Reference 정합 PR 8 — top-left back button label (a11y). */
  readonly backLabel: string;
  /** Reference 정합 PR 8 — top-right locale pill (e.g., "EN"). */
  readonly currentLocaleBadge: string;
  /** 뒤로 가기 동작 (router.back 또는 namespaced link). */
  readonly onBack?: () => void;
}

export function HeroGallery({
  photos,
  placeholderLabel,
  fallbackImageUrl,
  backLabel,
  currentLocaleBadge,
  onBack,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fallbackFailed, setFallbackFailed] = useState(false);

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
    if (fallbackImageUrl && !fallbackFailed) {
      return (
        <div className="relative h-[375px] w-full overflow-hidden lg:h-[400px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fallbackImageUrl}
            alt=""
            loading="eager"
            onError={() => setFallbackFailed(true)}
            className="h-full w-full object-cover"
          />
          <span className="sr-only">{placeholderLabel}</span>
        </div>
      );
    }
    return (
      <div className="relative h-[375px] w-full overflow-hidden lg:h-[400px]">
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
        className="flex h-[375px] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth lg:h-[400px]"
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
      {/* Reference 정합 PR 8 — hero overlay + back button (top-left) + locale pill (top-right). */}
      <div className="c-detail-hero-overlay" aria-hidden="true" />
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-hesya-navy-900 backdrop-blur-sm transition hover:bg-white"
      >
        <span aria-hidden="true" className="text-[18px] leading-none">
          ←
        </span>
      </button>
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 z-10 inline-flex h-9 items-center gap-1 rounded-full bg-white/85 px-3 mono text-[11px] font-semibold uppercase tracking-[0.06em] text-hesya-navy-900 backdrop-blur-sm"
      >
        🌐 {currentLocaleBadge}
      </span>
    </div>
  );
}
