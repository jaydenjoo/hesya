"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Link } from "@/i18n/navigation";

import { MarketingEyebrow } from "./MarketingEyebrow";

const GREETING_CYCLE_MS = 2800;

function subscribeMediaQuery(callback: () => void) {
  const desktop = window.matchMedia("(min-width: 768px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  desktop.addEventListener("change", callback);
  reduced.addEventListener("change", callback);
  return () => {
    desktop.removeEventListener("change", callback);
    reduced.removeEventListener("change", callback);
  };
}

function getVideoSnapshot() {
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function MarketingHero() {
  const t = useTranslations("MarketingLanding");
  const greetings = t.raw("heroGreetings") as string[];
  const trust = t.raw("heroTrust") as string[];
  const [idx, setIdx] = useState(0);
  const showVideo = useSyncExternalStore(
    subscribeMediaQuery,
    getVideoSnapshot,
    () => false,
  );

  useEffect(() => {
    if (greetings.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % greetings.length),
      GREETING_CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [greetings.length]);

  return (
    <section
      id="travelers"
      aria-labelledby="hero-h1"
      className="relative overflow-hidden bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[3fr_2fr] md:gap-16">
        <div>
          <MarketingEyebrow>
            {t("heroEyebrowEn")} <span aria-hidden="true">·</span>{" "}
            <span lang="ko" className="normal-case">
              {t("heroEyebrowKr")}
            </span>
          </MarketingEyebrow>

          <h1
            id="hero-h1"
            aria-live="polite"
            className="relative font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-6xl lg:text-7xl"
            style={{ minHeight: "1.25em" }}
          >
            {greetings.map((g, i) => (
              <span
                key={g}
                aria-hidden={i !== idx}
                className={`left-0 top-0 block transition-opacity duration-700 ease-out ${
                  i === idx ? "opacity-100" : "absolute inset-0 opacity-0"
                }`}
              >
                {g}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-hesya-navy-900/80">
            {t("heroSub")}
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-hesya-navy-900/70">
            {trust.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 before:font-bold before:text-hesya-amber-700 before:content-['✓']"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/c"
              className="inline-flex h-[52px] items-center rounded-full bg-hesya-amber-500 px-7 text-base font-bold text-hesya-navy-900 transition hover:bg-hesya-amber-600"
            >
              {t("heroCtaPrimary")}
            </Link>
            <a
              href="#salons"
              className="inline-flex h-[52px] items-center rounded-full border border-hesya-amber-700 px-6 text-sm text-hesya-amber-700 transition hover:bg-hesya-peach-100"
            >
              {t("heroCtaSecondary")}
            </a>
          </div>
        </div>

        <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-hesya-peach-100 md:aspect-[4/5]">
          <Image
            src="/assets/images/hero-poster.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            priority
            className="object-cover"
            aria-hidden="true"
          />
          {showVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster="/assets/images/hero-poster.webp"
              width={1280}
              height={1600}
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            >
              <source
                src="/assets/videos/hero-silk-petal.mp4"
                type="video/mp4"
              />
            </video>
          ) : null}

          <div
            className="absolute bottom-5 left-5 w-[240px] rounded-2xl bg-hesya-peach-50/85 p-4 shadow-lg [backdrop-filter:blur(14px)_saturate(140%)]"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-hesya-navy-700">
              <span aria-hidden="true">{t("heroActivityFlag")}</span>{" "}
              <strong className="text-hesya-navy-900">
                {t("heroActivityName")}
              </strong>{" "}
              {t("heroActivityVerb")}
            </p>
            <p className="mt-1 font-heading text-lg italic text-hesya-navy-900">
              &ldquo;{t("heroActivityQuote")}&rdquo;
            </p>
            <p className="mt-1 text-xs text-hesya-navy-700">
              {t("heroActivityMeta")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
