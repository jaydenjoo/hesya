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
 * Store 카드 배경 4 variant cycling (reference landing.css .alt-1~4).
 * c-landing.css의 .c-store-card-img.alt-1~4와 1:1 매핑.
 */
const STORE_CARD_ALT_VARIANTS = ["alt-1", "alt-2", "alt-3", "alt-4"] as const;
function pickStoreCardAlt(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (
    STORE_CARD_ALT_VARIANTS[Math.abs(h) % STORE_CARD_ALT_VARIANTS.length] ??
    STORE_CARD_ALT_VARIANTS[0]!
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
    <div className="c-landing-stage">
      <div className="c-landing">
        {/*
         * Desktop bezel mockup: iPhone notch + statusbar (9:41 + signal/wifi/battery).
         * 모바일(<1024)에선 c-landing.css에서 display:none — 장식 전용.
         * Reference: docs/design/reference/landing.css L29-61 + landing-app.jsx L194-260.
         */}
        <div className="c-landing-statusbar" aria-hidden="true">
          <span className="c-landing-notch" />
          <span>9:41</span>
          <div className="c-landing-statusbar-icons">
            {/* Signal bars */}
            <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
              <rect
                x="0"
                y="6"
                width="3"
                height="4"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="4"
                y="4"
                width="3"
                height="6"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="8"
                y="2"
                width="3"
                height="8"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="12"
                y="0"
                width="3"
                height="10"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
            {/* Wifi */}
            <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
              <path
                d="M8 3a6 6 0 0 1 4 1.5l1-1A8 8 0 0 0 8 1a8 8 0 0 0-5 2.5l1 1A6 6 0 0 1 8 3"
                fill="currentColor"
              />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            </svg>
            {/* Battery */}
            <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden="true">
              <rect
                x="0.5"
                y="0.5"
                width="18"
                height="10"
                rx="2.5"
                stroke="currentColor"
                fill="none"
              />
              <rect
                x="2"
                y="2"
                width="15"
                height="7"
                rx="1"
                fill="currentColor"
              />
              <path d="M20 4v3a1.5 1.5 0 0 0 0-3z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Sticky topbar — brand + lang pill */}
        <header className="c-landing-topbar">
          <div className="c-landing-topbar-inner">
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

        <div className="c-landing-body w-full">
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

          {/* AI photo entry — reference landing.css .ai-card 정합 */}
          {labels.aiPhotoCta && labels.aiPhotoSubtitle && (
            <Link
              href={`/${locale}/c/photo-analyze`}
              data-testid="landing-photo-cta"
              className="c-ai-card"
            >
              <div>
                <h4 className="c-ai-card-title">{labels.aiPhotoCta}</h4>
                <p className="c-ai-card-sl">{labels.aiPhotoSubtitle}</p>
                <span aria-hidden="true" className="c-ai-card-cta">
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

          {/* Stores grid — reference .store-row horizontal scroll */}
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
                <div className="c-store-row">
                  {stores.map((s) => (
                    <StoreCard
                      key={s.id}
                      store={s}
                      locale={locale}
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
            <section
              data-testid="landing-country"
              className="c-country-section"
            >
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
              <div className="c-trend-chips">
                {mockTrending.map((t) => (
                  <button
                    key={t.rank}
                    type="button"
                    onClick={() => {
                      setSearch(t.text);
                      navigate(region, t.text);
                    }}
                    className="c-trend-chip"
                  >
                    <span className="c-trend-rank">#{t.rank}</span>
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
              <div className="c-ugc-row -mx-5 sm:mx-0">
                {mockUGCCards.map((c) => (
                  <article key={c.id} className="c-ugc-card">
                    <div className="c-ugc-card-img">
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
                        className="c-ugc-card-source"
                        style={{
                          color:
                            c.source === "instagram" ? "#C13584" : "#FE2C55",
                        }}
                      >
                        {c.source === "instagram" ? "◉" : "红"}
                      </span>
                    </div>
                    <div className="c-ugc-card-meta">
                      <div className="c-ugc-card-meta-top">
                        <span aria-hidden="true">{c.flag}</span>
                        <span className="c-ugc-card-name">{c.name}</span>
                        <span
                          aria-label={`${c.stars} stars`}
                          className="c-ugc-card-stars"
                        >
                          {"★".repeat(c.stars)}
                        </span>
                      </div>
                      <p className="c-ugc-card-quote">
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

          {/* Reviews — reference landing.css .reviews-l / .review-card 정합 */}
          {mockReviews && mockReviews.length > 0 && labels.reviewsTitle && (
            <section data-testid="landing-reviews" className="mt-12">
              <header className="mb-2 px-5">
                <h3 className="font-heading text-[18px] font-semibold italic tracking-[-0.01em] text-hesya-navy-900 sm:text-[20px]">
                  {labels.reviewsTitle}
                </h3>
                {labels.reviewsSubtitle && (
                  <p className="mt-1 text-[12px] text-hesya-navy-900/55">
                    {labels.reviewsSubtitle}
                  </p>
                )}
              </header>
              <div className="c-reviews">
                {mockReviews.map((r) => (
                  <article key={r.id} className="c-review-card">
                    <div className="c-review-card-left">
                      <span aria-hidden="true" className="c-review-card-flag">
                        {r.flag}
                      </span>
                      <span
                        aria-label={`${r.stars} stars`}
                        className="c-review-card-stars"
                      >
                        {"★".repeat(r.stars)}
                      </span>
                    </div>
                    <div className="c-review-card-body">
                      <p className="c-review-card-quote">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                      <p className="c-review-card-trans">→ {r.translation}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Safety strip — reference landing.css .safety-strip 정합 */}
          {labels.safetyTitle &&
            labels.safetyStat1 &&
            labels.safetyStat2 &&
            labels.safetyStat3 &&
            labels.safetyStat4 && (
              <section data-testid="landing-safety" className="c-safety-strip">
                <h3 className="c-safety-heading">{labels.safetyTitle}</h3>
                <ul className="c-safety-stats">
                  {[
                    ["🇰🇷", labels.safetyStat1],
                    ["👥", labels.safetyStat2],
                    ["📍", labels.safetyStat3],
                    ["💬", labels.safetyStat4],
                  ].map(([icon, text], i) => (
                    <li key={i} className="c-safety-stat">
                      <span aria-hidden="true" className="c-safety-stat-ico">
                        {icon}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                {labels.safetySource && (
                  <p className="c-safety-source">{labels.safetySource}</p>
                )}
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
  verifiedBadge,
  reviewCountSuffix,
}: {
  store: PublicStore;
  locale: string;
  verifiedBadge: string;
  reviewCountSuffix: string;
}) {
  const showRating = store.rating != null && store.reviewCount > 0;
  const showVerified = store.reviewCount >= 100;
  const altClass = pickStoreCardAlt(store.id);
  return (
    <Link
      href={`/${locale}/c/store/${store.id}`}
      prefetch
      className="c-store-card"
    >
      <div aria-hidden="true" className={`c-store-card-img ${altClass}`} />
      <div className="c-store-card-pad">
        <h4 className="c-store-card-h4">{store.name}</h4>
        <div className="c-store-card-meta">
          {store.region && <span>📍 {store.region}</span>}
          {store.category && (
            <>
              <span>·</span>
              <span>{store.category.replace(/_/g, " ")}</span>
            </>
          )}
        </div>
        {(showRating || showVerified) && (
          <div data-testid="landing-store-rating" className="c-store-card-row">
            {showRating && (
              <>
                <span aria-hidden="true" className="c-store-card-stars">
                  ★
                </span>
                <span style={{ fontWeight: 600, color: "#1a2238" }}>
                  {store.rating!.toFixed(2)}
                </span>
                <span className="c-store-card-count">
                  {reviewCountSuffix.replace("{n}", String(store.reviewCount))}
                </span>
              </>
            )}
            {showVerified && (
              <span className="c-store-card-badge-kverified">
                ★ {verifiedBadge}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
