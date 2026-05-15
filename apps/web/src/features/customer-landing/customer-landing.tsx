"use client";

/**
 * Plan v3 M4.5 — customer 랜딩 Client 컴포넌트.
 *
 * Phase 2 fast track #3 (2026-05-15): reference `docs/design/reference/landing-app.jsx`
 * + `landing.css` 정합 적용. 10 items:
 *  1. Mood/Region chips horizontal scroll
 *  2. Sticky topbar (brand + lang pill, blur backdrop)
 *  3. Greeting opacity crossfade stack (5 abs-positioned)
 *  4. HeroMotif SVG + animated underline
 *  5. Search input mic button (peach circle)
 *  6. Lang pill + language bottom sheet (6 locale)
 *  7. UGC "Show more" dashed card
 *  8. verifiedBadge 조건 적용 (reviewCount >= 100 heuristic)
 *  9. Tab bar (Search/Bookings/Chat/MyPage 4-tab fixed bottom)
 * 10. "Loved by travelers from your country" horizontal scroll
 *
 * region chip / search input은 URL 쿼리 동기화 (?region= / ?q=). useTransition + router.push로
 * SSR 갱신 — 페이지 진입 시 검색 결과 SEO friendly.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useRouter as useI18nRouter } from "@/i18n/navigation";
import { useEffect, useState, useTransition } from "react";
import type { PublicStore } from "@/shared/lib/dal/stores";
import type {
  MockReview,
  MockTrendingSearch,
  MockUGCCard,
} from "@/lib/mock-fixtures/landing";

const GREETINGS: ReadonlyArray<{ lang: string; text: string; kr: boolean }> = [
  { lang: "en", text: "Welcome to Korea.", kr: false },
  { lang: "ko", text: "한국에 오신 것을 환영합니다.", kr: true },
  { lang: "ja", text: "韓国へようこそ。", kr: true },
  { lang: "zh", text: "欢迎来到韩国。", kr: true },
  { lang: "vi", text: "Chào mừng đến Hàn Quốc.", kr: false },
];
const GREETING_ROTATION_MS = 3000;
const PLACEHOLDER_ROTATION_MS = 3500;

const MOOD_ICONS = [
  "🎬",
  "✨",
  "💗",
  "🌸",
  "💋",
  "🎀",
  "🌟",
  "🔥",
  "✂️",
] as const;

const LANG_OPTIONS = [
  { code: "ko", display: "KR", label: "한국어" },
  { code: "en", display: "EN", label: "English" },
  { code: "ja", display: "JP", label: "日本語" },
  { code: "zh-CN", display: "CN", label: "中文(简)" },
  { code: "zh-TW", display: "TW", label: "中文(繁)" },
  { code: "vi", display: "VI", label: "Tiếng Việt" },
] as const;

function useRotatedPlaceholder(
  placeholders: ReadonlyArray<string>,
  fallback: string,
): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (placeholders.length === 0) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % placeholders.length),
      PLACEHOLDER_ROTATION_MS,
    );
    return () => clearInterval(t);
  }, [placeholders.length]);
  return placeholders[idx] ?? fallback;
}

/** Greeting stack — 5 abs-positioned, active만 opacity 1. */
function GreetingStack() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % GREETINGS.length),
      GREETING_ROTATION_MS,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="c-greeting-stack"
      data-testid="landing-greeting"
      aria-live="polite"
    >
      {GREETINGS.map((g, i) => (
        <div
          key={i}
          className={
            "c-greeting" + (g.kr ? " kr" : "") + (i === idx ? " active" : "")
          }
          lang={g.lang}
        >
          {g.text}
        </div>
      ))}
    </div>
  );
}

/**
 * Store 카드 배경 4색 cycling (reference landing.css alt-1~4).
 * peach-amber / navy-cream radial / slate-amber / sage-amber.
 */
const STORE_CARD_BGS = [
  "linear-gradient(135deg, #F5DDC8, #D88B5B)",
  "radial-gradient(circle at 30% 30%, #FAF4ED, #1A2238 80%)",
  "linear-gradient(135deg, #C9D6E8, #D88B5B)",
  "linear-gradient(135deg, #D6E8C9, #D88B5B)",
] as const;
function pickStoreCardBg(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (
    STORE_CARD_BGS[Math.abs(h) % STORE_CARD_BGS.length] ?? STORE_CARD_BGS[0]!
  );
}

/** CamIllust SVG — AI photo card 우측 사이드 일러스트 (reference landing-app.jsx CamIllust 정합). */
function CamIllust() {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden="true"
      className="h-[80px] w-[80px]"
      fill="none"
    >
      <g stroke="#1A2238" strokeWidth="2" strokeLinecap="round" fill="none">
        <rect x="14" y="24" width="48" height="34" rx="6" />
        <circle cx="38" cy="42" r="10" />
        <circle cx="38" cy="42" r="5" />
        <path d="M28 24 L34 18 H42 L48 24" />
      </g>
      <g stroke="#D88B5B" strokeWidth="1.5" fill="none">
        <path d="M60 18 L62 22 L66 24 L62 26 L60 30 L58 26 L54 24 L58 22 Z" />
      </g>
    </svg>
  );
}

/** HeroMotif SVG — reference 정합. */
function HeroMotif() {
  return (
    <svg className="c-hero-motif" viewBox="0 0 200 200" aria-hidden="true">
      <g stroke="#D88B5B" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M40 50h32M56 38v22" />
        <circle cx="56" cy="92" r="22" />
      </g>
      <g
        stroke="rgba(216,139,91,0.55)"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="2 4"
      >
        <path d="M88 95 Q115 75 140 95" />
      </g>
      <g stroke="#D88B5B" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M132 70 L122 156" />
        <path d="M168 64 L158 150" />
        <path d="M126 108h36" />
      </g>
    </svg>
  );
}

export interface CustomerLandingLabels {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  placeholders: ReadonlyArray<string>;
  moodLabel: string;
  moods: ReadonlyArray<string>;
  regionLabel: string;
  regionAll: string;
  resultsCount: string;
  emptyTitle: string;
  emptySubtitle: string;
  signIn: string;
  mypage: string;
  viewStore: string;
  reviewCountSuffix: string;
  verifiedBadge: string;
  aiPhotoCta?: string;
  aiPhotoSubtitle?: string;
  liveRow?: string;
  ugcTitle?: string;
  ugcSubtitle?: string;
  ugcShowMore?: string;
  trendingTitle?: string;
  trendingSubtitle?: string;
  reviewsTitle?: string;
  reviewsSubtitle?: string;
  safetyTitle?: string;
  safetyStat1?: string;
  safetyStat2?: string;
  safetyStat3?: string;
  safetyStat4?: string;
  safetySource?: string;
  /** C1 fast track #3 신규: country curation 섹션. */
  countryTitle?: string;
  countrySubtitle?: string;
  langSheetTitle?: string;
  tabSearch?: string;
  tabBookings?: string;
  tabChat?: string;
  tabMypage?: string;
}

interface Props {
  locale: string;
  isAuthed: boolean;
  initialRegion: string;
  initialSearch: string;
  regions: string[];
  stores: PublicStore[];
  labels: CustomerLandingLabels;
  mockUGCCards?: ReadonlyArray<MockUGCCard>;
  mockTrending?: ReadonlyArray<MockTrendingSearch>;
  mockReviews?: ReadonlyArray<MockReview>;
}

export function CustomerLanding({
  locale,
  isAuthed,
  initialRegion,
  initialSearch,
  regions,
  stores,
  labels,
  mockUGCCards,
  mockTrending,
  mockReviews,
}: Props) {
  const router = useRouter();
  const i18nRouter = useI18nRouter();
  const pathname = usePathname();
  const [region, setRegion] = useState(initialRegion);
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const rotatedPlaceholder = useRotatedPlaceholder(
    labels.placeholders,
    labels.searchPlaceholder,
  );

  const currentLang =
    LANG_OPTIONS.find((l) => l.code === locale) ?? LANG_OPTIONS[1];

  const navigate = (nextRegion: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextRegion) params.set("region", nextRegion);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/${locale}/c?${qs}` : `/${locale}/c`);
    });
  };

  const handleLocaleChange = (code: string) => {
    setLangSheetOpen(false);
    i18nRouter.replace(pathname, { locale: code as "ko" });
  };

  return (
    <div className="c-landing relative min-h-screen overflow-x-hidden bg-hesya-peach-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 1000px 600px at 50% -100px, var(--hesya-peach-200), transparent 55%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[40vh]"
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 50% 100%, var(--hesya-peach-100), transparent 60%)",
        }}
      />

      {/* Sticky topbar — brand + lang pill */}
      <header className="c-landing-topbar">
        <div className="c-landing-topbar-inner mx-auto max-w-5xl">
          <span className="c-landing-brand">Hesya</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="c-lang-pill"
              onClick={() => setLangSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={langSheetOpen}
            >
              <span aria-hidden="true">🌐</span>
              <span>{currentLang.display}</span>
              <span aria-hidden="true" className="text-[10px] opacity-50">
                ▾
              </span>
            </button>
            <Link
              href={isAuthed ? `/${locale}/c/mypage` : `/${locale}/c/sign-in`}
              className="rounded-full bg-white/70 px-4 py-1.5 text-[12px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 hover:bg-white"
            >
              {isAuthed ? labels.mypage : labels.signIn}
            </Link>
          </div>
        </div>
      </header>

      <div className="c-landing-body mx-auto w-full max-w-5xl">
        {/* Hero with HeroMotif + animated underline */}
        <section className="c-hero">
          <HeroMotif />
          <p className="c-hero-eyebrow">{labels.eyebrow}</p>
          <GreetingStack />
          <div className="c-hero-underline" />
          <p className="c-hero-sub">{labels.subtitle}</p>
        </section>

        {/* Search input + mic */}
        <section className="c-search-zone">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(region, search);
            }}
            className="c-search-input"
          >
            <span className="c-lead" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={rotatedPlaceholder}
              data-testid="landing-search-input"
              aria-label={labels.searchPlaceholder}
            />
            <button
              type="button"
              className="c-mic"
              aria-label="Voice search"
              onClick={() => {
                /* Voice search UI mock — Web Speech API 베타 후 wire */
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="2" width="6" height="13" rx="3" />
                <path d="M19 10a7 7 0 0 1-14 0M12 19v3" />
              </svg>
            </button>
          </form>
        </section>

        {/* Mood chips horizontal scroll */}
        {labels.moods.length > 0 && (
          <>
            <div className="c-mood-cap">{labels.moodLabel}</div>
            <div data-testid="landing-mood-row" className="c-mood-scroll">
              {labels.moods.map((text, i) => {
                const icon = MOOD_ICONS[i % MOOD_ICONS.length];
                return (
                  <button
                    key={text}
                    type="button"
                    onClick={() => {
                      setSearch(text);
                      navigate(region, text);
                    }}
                    className="c-mood-chip"
                  >
                    <span aria-hidden="true">{icon}</span>
                    {text}
                  </button>
                );
              })}
            </div>
            {labels.liveRow && (
              <div data-testid="landing-live-row" className="c-live-row">
                <span aria-hidden="true" className="c-live-dot" />
                {labels.liveRow}
              </div>
            )}
          </>
        )}

        {/* AI photo entry */}
        {labels.aiPhotoCta && labels.aiPhotoSubtitle && (
          <Link
            href={`/${locale}/c/photo-analyze`}
            data-testid="landing-photo-cta"
            className="mx-5 mb-2 mt-4 grid grid-cols-[1fr_80px] items-center gap-3 rounded-3xl bg-hesya-peach-200 px-5 py-5 transition hover:shadow-[0_8px_24px_-8px_rgba(216,139,91,0.35)]"
          >
            <div className="flex flex-col gap-1.5">
              <h4 className="font-heading text-[22px] font-semibold italic leading-[1.2] text-hesya-navy-900">
                {labels.aiPhotoCta}
              </h4>
              <p className="text-[11.5px] text-hesya-navy-900/65">
                {labels.aiPhotoSubtitle}
              </p>
              <span
                aria-hidden="true"
                className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-hesya-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_10px_rgba(232,169,122,0.35)]"
              >
                ✨ →
              </span>
            </div>
            <CamIllust />
          </Link>
        )}

        {/* Region chips horizontal scroll */}
        <section className="c-region-row">
          <div className="c-region-label">{labels.regionLabel}</div>
          <div className="c-region-scroll">
            <button
              type="button"
              className={"c-region-chip" + (!region ? " active" : "")}
              onClick={() => {
                setRegion("");
                navigate("", search);
              }}
            >
              {labels.regionAll}
            </button>
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                className={"c-region-chip" + (region === r ? " active" : "")}
                onClick={() => {
                  setRegion(r);
                  navigate(r, search);
                }}
              >
                <span aria-hidden="true">📍</span>
                {r}
              </button>
            ))}
          </div>
        </section>

        {/* Stores grid */}
        <div className="px-5 pt-6">
          {stores.length === 0 ? (
            <div className="rounded-3xl bg-white/60 px-6 py-16 text-center ring-1 ring-hesya-navy-900/10">
              <h2 className="font-heading text-[20px] font-semibold italic text-hesya-navy-900">
                {labels.emptyTitle}
              </h2>
              <p className="mt-2 text-[13px] text-hesya-navy-900/55">
                {labels.emptySubtitle}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[12px] text-hesya-navy-900/55">
                {labels.resultsCount}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((s) => (
                  <StoreCard
                    key={s.id}
                    store={s}
                    locale={locale}
                    viewLabel={labels.viewStore}
                    verifiedBadge={labels.verifiedBadge}
                    reviewCountSuffix={labels.reviewCountSuffix}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* "Loved by travelers from your country" horizontal scroll */}
        {stores.length > 0 && labels.countryTitle && (
          <section data-testid="landing-country" className="c-country-section">
            <header className="c-country-head">
              <h3>{labels.countryTitle}</h3>
              {labels.countrySubtitle && (
                <span className="c-sub">{labels.countrySubtitle}</span>
              )}
            </header>
            <div className="c-country-scroll">
              {[...stores]
                .sort((a, b) => b.reviewCount - a.reviewCount)
                .slice(0, 8)
                .map((s) => (
                  <StoreCard
                    key={`country-${s.id}`}
                    store={s}
                    locale={locale}
                    viewLabel={labels.viewStore}
                    verifiedBadge={labels.verifiedBadge}
                    reviewCountSuffix={labels.reviewCountSuffix}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Trending */}
        {mockTrending && mockTrending.length > 0 && labels.trendingTitle && (
          <section data-testid="landing-trending" className="mt-12 px-5">
            <header className="mb-3">
              <h3 className="font-heading text-[18px] font-semibold italic tracking-[-0.01em] text-hesya-navy-900 sm:text-[20px]">
                {labels.trendingTitle}
              </h3>
              {labels.trendingSubtitle && (
                <p className="mt-1 text-[12px] text-hesya-navy-900/55">
                  {labels.trendingSubtitle}
                </p>
              )}
            </header>
            <div className="flex flex-wrap gap-2">
              {mockTrending.map((t) => (
                <button
                  key={t.rank}
                  type="button"
                  onClick={() => {
                    setSearch(t.text);
                    navigate(region, t.text);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] text-hesya-navy-900 ring-1 ring-hesya-peach-200 transition hover:bg-hesya-peach-100"
                >
                  <span className="font-mono text-[11px] font-bold text-hesya-amber-600">
                    #{t.rank}
                  </span>
                  {t.text}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* UGC + Show more dashed card */}
        {mockUGCCards && mockUGCCards.length > 0 && labels.ugcTitle && (
          <section data-testid="landing-ugc" className="mt-12 px-5">
            <header className="mb-4">
              <h3 className="font-heading text-[18px] font-semibold italic tracking-[-0.01em] text-hesya-navy-900 sm:text-[20px]">
                {labels.ugcTitle}
              </h3>
              {labels.ugcSubtitle && (
                <p className="mt-1 text-[12px] text-hesya-navy-900/55">
                  {labels.ugcSubtitle}
                </p>
              )}
            </header>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              {mockUGCCards.map((c) => (
                <article
                  key={c.id}
                  className="flex h-[250px] w-[200px] flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-hesya-navy-900/10"
                >
                  <div className="relative h-[168px] flex-shrink-0 bg-gradient-to-br from-hesya-peach-100 to-hesya-amber-200">
                    <Image
                      src={c.imageUrl}
                      alt={`${c.name} — ${c.quote}`}
                      width={200}
                      height={168}
                      loading="lazy"
                      sizes="200px"
                      className="h-full w-full object-cover"
                    />
                    <span
                      aria-label={
                        c.source === "instagram" ? "Instagram" : "Xiaohongshu"
                      }
                      className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-[10px] font-bold backdrop-blur"
                      style={{
                        color: c.source === "instagram" ? "#C13584" : "#FE2C55",
                      }}
                    >
                      {c.source === "instagram" ? "◉" : "红"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <span aria-hidden="true">{c.flag}</span>
                      <span className="font-medium text-hesya-navy-900">
                        {c.name}
                      </span>
                      <span
                        aria-label={`${c.stars} stars`}
                        className="ml-auto text-[11px] text-hesya-amber-500"
                      >
                        {"★".repeat(c.stars)}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-hesya-navy-900/80 [word-break:keep-all]">
                      &ldquo;{c.quote}&rdquo;
                    </p>
                  </div>
                </article>
              ))}
              {labels.ugcShowMore && (
                <button
                  type="button"
                  className="c-ugc-more"
                  data-testid="landing-ugc-more"
                >
                  <span aria-hidden="true" className="text-[20px]">
                    ↗
                  </span>
                  <span>{labels.ugcShowMore}</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Reviews */}
        {mockReviews && mockReviews.length > 0 && labels.reviewsTitle && (
          <section data-testid="landing-reviews" className="mt-12 px-5">
            <header className="mb-4">
              <h3 className="font-heading text-[18px] font-semibold italic tracking-[-0.01em] text-hesya-navy-900 sm:text-[20px]">
                {labels.reviewsTitle}
              </h3>
              {labels.reviewsSubtitle && (
                <p className="mt-1 text-[12px] text-hesya-navy-900/55">
                  {labels.reviewsSubtitle}
                </p>
              )}
            </header>
            <div className="flex flex-col gap-3">
              {mockReviews.map((r) => (
                <article
                  key={r.id}
                  className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-hesya-peach-200"
                >
                  <div className="flex flex-shrink-0 flex-col items-center gap-1">
                    <span aria-hidden="true" className="text-[22px]">
                      {r.flag}
                    </span>
                    <span
                      aria-label={`${r.stars} stars`}
                      className="text-[11px] text-hesya-amber-500"
                    >
                      {"★".repeat(r.stars)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium leading-relaxed text-hesya-navy-900 [word-break:keep-all]">
                      &ldquo;{r.quote}&rdquo;
                    </p>
                    <p className="mt-1.5 text-[12px] italic text-hesya-navy-900/55">
                      → {r.translation}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Safety */}
        {labels.safetyTitle &&
          labels.safetyStat1 &&
          labels.safetyStat2 &&
          labels.safetyStat3 &&
          labels.safetyStat4 && (
            <section
              data-testid="landing-safety"
              className="mt-12 border-t border-[var(--trust-rose,#e8c4d6)] px-5 pt-6"
            >
              <div className="rounded-2xl bg-hesya-peach-100 px-5 py-5">
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-hesya-navy-900">
                  {labels.safetyTitle}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {[
                    ["🇰🇷", labels.safetyStat1],
                    ["👥", labels.safetyStat2],
                    ["📍", labels.safetyStat3],
                    ["💬", labels.safetyStat4],
                  ].map(([icon, text], i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[24px_1fr] items-start gap-2.5 text-[12px] leading-relaxed text-hesya-navy-900/75 [word-break:keep-all]"
                    >
                      <span aria-hidden="true" className="text-[14px]">
                        {icon}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                {labels.safetySource && (
                  <p className="mt-3 border-t border-dashed border-hesya-navy-900/10 pt-2.5 text-[10px] tracking-[0.02em] text-hesya-navy-900/45">
                    {labels.safetySource}
                  </p>
                )}
              </div>
            </section>
          )}
      </div>

      {/* Tab bar (fixed bottom nav) */}
      <nav className="c-tabbar" aria-label="Main navigation">
        <TabbarItem
          href={`/${locale}/c`}
          active
          label={labels.tabSearch ?? "Search"}
          icon={<TabIconSearch />}
        />
        <TabbarItem
          href={`/${locale}/c/mypage`}
          label={labels.tabBookings ?? "Bookings"}
          icon={<TabIconCalendar />}
        />
        <TabbarItem
          href={`/${locale}/c/chat`}
          label={labels.tabChat ?? "Chat"}
          icon={<TabIconMessage />}
        />
        <TabbarItem
          href={`/${locale}/c/mypage`}
          label={labels.tabMypage ?? "MyPage"}
          icon={<TabIconUser />}
        />
      </nav>

      {/* Language bottom sheet */}
      {langSheetOpen && (
        <div
          className="c-lang-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={labels.langSheetTitle ?? "Choose language"}
          onClick={() => setLangSheetOpen(false)}
        >
          <div className="c-lang-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="c-lang-sheet-handle" aria-hidden="true" />
            <h3 className="c-lang-sheet-title">
              {labels.langSheetTitle ?? "Choose language"}
            </h3>
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={
                  "c-lang-sheet-item" + (l.code === locale ? " active" : "")
                }
                onClick={() => handleLocaleChange(l.code)}
              >
                <span>{l.label}</span>
                {l.code === locale && (
                  <span className="c-lang-sheet-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabbarItem({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className={"c-tabbar-item" + (active ? " active" : "")}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function TabIconSearch() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function TabIconCalendar() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function TabIconMessage() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function TabIconUser() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StoreCard({
  store,
  locale,
  viewLabel,
  verifiedBadge,
  reviewCountSuffix,
}: {
  store: PublicStore;
  locale: string;
  viewLabel: string;
  verifiedBadge: string;
  reviewCountSuffix: string;
}) {
  const showRating = store.rating != null && store.reviewCount > 0;
  // 인벤토리 item 8: 항상 표시 → 조건부. reviewCount 100건 이상 = 정착 매장.
  // 실 verified 필드 도입은 후속 DAL 확장 task.
  const showVerified = store.reviewCount >= 100;
  return (
    <Link
      href={`/${locale}/c/store/${store.id}`}
      prefetch
      className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-hesya-navy-900/10 transition hover:shadow-[0_8px_24px_-8px_rgba(26,34,56,0.15)]"
    >
      <div
        aria-hidden="true"
        style={{ background: pickStoreCardBg(store.id) }}
        className="aspect-[5/4]"
      />
      <div className="p-4">
        <h3 className="truncate font-heading text-[17px] font-semibold italic text-hesya-navy-900">
          {store.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-hesya-navy-900/55">
          {store.region && <span>📍 {store.region}</span>}
          {store.category && (
            <>
              <span>·</span>
              <span>{store.category.replace(/_/g, " ")}</span>
            </>
          )}
        </div>
        {(showRating || showVerified) && (
          <div
            data-testid="landing-store-rating"
            className="mt-2 flex items-center gap-1.5 text-[12px]"
          >
            {showRating && (
              <>
                <span aria-hidden="true" className="text-hesya-amber-600">
                  ★
                </span>
                <span className="font-semibold text-hesya-navy-900">
                  {store.rating!.toFixed(2)}
                </span>
                <span className="text-hesya-navy-900/55">
                  {reviewCountSuffix.replace("{n}", String(store.reviewCount))}
                </span>
              </>
            )}
            {showVerified && (
              <span className="ml-auto rounded-full bg-hesya-peach-100 px-2 py-0.5 text-[10.5px] font-semibold text-hesya-amber-600 ring-1 ring-hesya-amber-600/20">
                ★ {verifiedBadge}
              </span>
            )}
          </div>
        )}
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-hesya-amber-600 group-hover:underline">
          {viewLabel} →
        </p>
      </div>
    </Link>
  );
}
