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
      className="relative overflow-hidden bg-hesya-peach-50 px-6 pb-20 pt-32 md:pb-20 md:pt-40"
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

        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br from-hesya-peach-200 to-hesya-amber-600 shadow-2xl">
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
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 35%, rgba(253,248,241,0.4), transparent 35%), radial-gradient(ellipse at 70% 80%, rgba(26,34,56,0.35), transparent 55%)",
            }}
          />

          <div
            className="absolute bottom-5 left-5 min-w-[240px] rounded-2xl border border-white/50 bg-hesya-peach-50/[0.78] p-4 shadow-lg [backdrop-filter:blur(14px)_saturate(140%)]"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="flex items-center gap-2 text-[13px] font-semibold text-hesya-navy-900">
              <span aria-hidden="true">{t("heroActivityFlag")}</span>
              <strong className="font-semibold">{t("heroActivityName")}</strong>
              <span className="font-normal">{t("heroActivityVerb")}</span>
            </p>
            <p className="mt-1 font-heading text-sm italic text-hesya-navy-900">
              &ldquo;{t("heroActivityQuote")}&rdquo;
            </p>
            <p className="mt-1 text-[11px] text-hesya-navy-700">
              {t("heroActivityMeta")}
            </p>
          </div>
        </div>
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 320 320"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        className="pointer-events-none absolute right-[-40px] top-[100px] hidden h-[320px] w-[320px] text-hesya-amber-700 opacity-30 lg:block"
      >
        <path d="M40,80 Q80,40 140,80 T260,80" />
        <path d="M180,140 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0 M220,180 L220,260" />
        <path d="M60,200 L100,240 M100,200 L60,240 M120,180 Q160,220 200,260" />
      </svg>
    </section>
  );
}
