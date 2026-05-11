"use client";

/**
 * Plan v3 Phase D2-B5 — 사진 lightbox.
 *
 * thumbnail 클릭 → fullscreen overlay 표시. ESC / 클릭으로 close. 좌우 화살표
 * 키 / 버튼으로 prev/next 이동. 모바일 환경에서도 동작 (body scroll lock).
 */

import { useCallback, useEffect, useState } from "react";

export interface LightboxPhoto {
  readonly url: string;
  readonly caption: string;
}

interface Props {
  readonly photos: ReadonlyArray<LightboxPhoto>;
  readonly emptyLabel: string;
  readonly closeLabel: string;
  readonly prevLabel: string;
  readonly nextLabel: string;
}

export function PhotoLightbox({
  photos,
  emptyLabel,
  closeLabel,
  prevLabel,
  nextLabel,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(() => {
    setOpenIdx((i) =>
      i === null ? null : (i - 1 + photos.length) % photos.length,
    );
  }, [photos.length]);
  const next = useCallback(() => {
    setOpenIdx((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (openIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [openIdx, close, prev, next]);

  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-hesya-peach-200 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
        {emptyLabel}
      </p>
    );
  }

  const active = openIdx !== null ? photos[openIdx] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <li key={`${p.url}-${i}`}>
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className="group block w-full overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <p className="truncate px-2.5 py-1.5 text-[11px] text-hesya-navy-900/65">
                {p.caption}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={close}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-hesya-navy-900/90 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label={closeLabel}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
          >
            ✕
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label={prevLabel}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label={nextLabel}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
              >
                ›
              </button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.caption}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] max-w-[88vw] rounded-lg object-contain shadow-2xl"
          />
          <p className="mt-4 max-w-[88vw] text-center text-[12px] text-white/80">
            {active.caption}
            {photos.length > 1 ? (
              <span className="ml-2 font-mono text-white/55">
                {openIdx! + 1}/{photos.length}
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </>
  );
}
