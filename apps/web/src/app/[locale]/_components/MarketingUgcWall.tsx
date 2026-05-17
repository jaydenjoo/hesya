"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { MarketingEyebrow } from "./MarketingEyebrow";
import { MarketingSectionNum } from "./MarketingSectionNum";

type UgcReview = {
  flag: string;
  nick: string;
  stars: string;
  quote: string;
  trans: string;
  src: string;
};

type VideoAsset = { src: string; poster: string };

const VIDEO_BY_INDEX: Record<number, VideoAsset> = {
  0: {
    src: "/assets/videos/ugc-sakura.mp4",
    poster: "/assets/images/ugc-sakura-poster.webp",
  },
  2: {
    src: "/assets/videos/ugc-mei.mp4",
    poster: "/assets/images/ugc-mei-poster.webp",
  },
  4: {
    src: "/assets/videos/ugc-linh.mp4",
    poster: "/assets/images/ugc-linh-poster.webp",
  },
};

const PHOTO_GRADIENTS: Record<number, string> = {
  3: "linear-gradient(135deg, #F8E9D9, #D88B5B)",
  5: "linear-gradient(135deg, #E8C4D6, #C97550)",
};

const COLUMN_INDICES: number[][] = [
  [0, 1],
  [2, 3, 4],
  [5, 6],
];

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function VideoCard({ asset, label }: { asset: VideoAsset; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || load) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load]);

  return (
    <video
      ref={ref}
      className="mb-3 aspect-square w-full rounded-xl object-cover object-center"
      poster={asset.poster}
      width={400}
      height={400}
      muted
      playsInline
      loop
      autoPlay={!reduced && load}
      preload="none"
      aria-label={label}
    >
      {load ? <source src={asset.src} type="video/mp4" /> : null}
    </video>
  );
}

export function MarketingUgcWall() {
  const t = useTranslations("MarketingLanding");
  const reviews = t.raw("ugcReviews") as UgcReview[];

  return (
    <section
      aria-labelledby="ugc-h2"
      className="relative bg-hesya-peach-100 px-6 py-20 md:py-32"
    >
      <MarketingSectionNum value="06" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <MarketingEyebrow centered>{t("ugcEyebrow")}</MarketingEyebrow>
          <h2
            id="ugc-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
          >
            {t.rich("ugcTitle", {
              em: (chunks) => (
                <em className="text-hesya-amber-700">{chunks}</em>
              ),
            })}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMN_INDICES.map((col, ci) => (
            <ul key={`col-${ci}`} role="list" className="flex flex-col gap-5">
              {col
                .filter((idx) => idx < reviews.length)
                .map((idx) => {
                  const r = reviews[idx]!;
                  const video = VIDEO_BY_INDEX[idx];
                  const photo = PHOTO_GRADIENTS[idx];
                  const isXhs = r.src.toLowerCase().includes("xiaohongshu");
                  return (
                    <li key={`${r.nick}-${r.src}`}>
                      <article className="relative rounded-2xl bg-white p-6 shadow-sm">
                        <span
                          className={`absolute right-5 top-5 text-[10.5px] font-bold uppercase tracking-[0.04em] ${
                            isXhs ? "text-[#C71838]" : "text-[#C13584]"
                          }`}
                        >
                          {isXhs ? "红 " : "◉ "}
                          {r.src}
                        </span>
                        {video ? (
                          <VideoCard
                            asset={video}
                            label={`${r.nick} ${r.trans}`}
                          />
                        ) : photo ? (
                          <div
                            aria-hidden="true"
                            className="mb-3 aspect-square w-full rounded-xl"
                            style={{ background: photo }}
                          />
                        ) : null}
                        <header className="flex items-center gap-2 pr-24">
                          <span aria-hidden="true" className="text-xl">
                            {r.flag}
                          </span>
                          <span className="font-heading text-sm text-hesya-navy-900">
                            {r.nick}
                          </span>
                          <span
                            aria-label={`${r.stars} rating`}
                            className="ml-auto text-xs tracking-[1px] text-hesya-amber-500"
                          >
                            {r.stars}
                          </span>
                        </header>
                        <p
                          lang="ko"
                          className="mt-3 text-[15px] leading-[1.65] text-hesya-navy-900"
                        >
                          &ldquo;{r.quote}&rdquo;
                        </p>
                        <p className="mt-2 font-heading text-[13px] italic leading-[1.55] text-hesya-navy-700">
                          {r.trans}
                        </p>
                      </article>
                    </li>
                  );
                })}
            </ul>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#"
            className="text-sm font-semibold text-hesya-amber-700 underline-offset-4 hover:underline"
          >
            {t("ugcMore")}
          </a>
        </div>
      </div>
    </section>
  );
}
