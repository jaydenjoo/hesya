"use client";

/**
 * Plan v3 M4.5 — customer 랜딩 Client 컴포넌트.
 *
 * region chip / search input은 URL 쿼리 동기화 (?region= / ?q=). useTransition + router.push로
 * SSR 갱신 — 페이지 진입 시 검색 결과 SEO friendly.
 *
 * 디자인: peach 배경 + amber accent + Fraunces 헤딩 (기존 /c/* 일관성).
 *
 * Batch 2 (2026-05-14): placeholder rotator (5 string 3.5s) + mood chips (9) + StoreCard rating bar.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { PublicStore } from "@/shared/lib/dal/stores";
import type {
  MockReview,
  MockTrendingSearch,
  MockUGCCard,
} from "@/lib/mock-fixtures/landing";

// 디자인 ref: `docs/design/reference/landing-app.jsx` greetings array.
// 5 언어 환영 인사 rotation — 외국인 손님 첫 진입 시 다국어 친화 시그널.
const GREETINGS: ReadonlyArray<{ lang: string; text: string; kr: boolean }> = [
  { lang: "en", text: "Welcome to Korea.", kr: false },
  { lang: "ko", text: "한국에 오신 것을 환영합니다.", kr: true },
  { lang: "ja", text: "韓国へようこそ。", kr: true },
  { lang: "zh", text: "欢迎来到韩国。", kr: true },
  { lang: "vi", text: "Chào mừng đến Hàn Quốc.", kr: false },
];
const GREETING_ROTATION_MS = 3500;
const PLACEHOLDER_ROTATION_MS = 3500;

// 9 mood — emoji + i18n text. 클릭 시 search input 자동 채움 + URL navigate.
// `text`만 검색에 사용 (emoji 검색 X). reference: docs/design/reference/landing-app.jsx:29-39.
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

function GreetingRotator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    // prefers-reduced-motion 존중 — 첫 인사만 표시.
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
  const g = GREETINGS[idx]!;
  return (
    <p
      data-testid="landing-greeting"
      aria-live="polite"
      lang={g.lang}
      className={`mb-3 text-[13px] font-medium text-hesya-navy-900/70 transition-opacity duration-500 sm:text-[14px] ${g.kr ? "kr" : ""}`}
    >
      <span aria-hidden="true" className="mr-1.5 opacity-60">
        🌏
      </span>
      {g.text}
    </p>
  );
}

export interface CustomerLandingLabels {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  /** Batch 2: 검색 placeholder rotation (5 items 권장). 빈 배열이면 정적 placeholder 사용. */
  placeholders: ReadonlyArray<string>;
  /** Batch 2: 분위기 chip 섹션 label (예: "Or browse by vibe / 분위기로 둘러보기"). */
  moodLabel: string;
  /** Batch 2: mood chip 텍스트 (9개 권장). icon은 클라이언트 상수 (MOOD_ICONS). */
  moods: ReadonlyArray<string>;
  regionLabel: string;
  regionAll: string;
  resultsCount: string;
  emptyTitle: string;
  emptySubtitle: string;
  signIn: string;
  mypage: string;
  viewStore: string;
  /** Batch 2: rating bar에서 "리뷰 N건" 카운트 단위 (예: "(412)"). 단순 prefix 표현 안 하고 caller가 ICU로 채움. */
  reviewCountSuffix: string;
  /** Batch 2: K-Verified badge. auto_approved 매장 모두 표시. */
  verifiedBadge: string;
  /** Epic B (2026-05-14): AI Photo Analysis CTA 제목. 미설정 시 CTA 숨김. */
  aiPhotoCta?: string;
  /** Epic B: CTA 서브 라인. */
  aiPhotoSubtitle?: string;
  /** Sprint 2A: live row / UGC / trending / reviews / safety 5섹션 labels. 미설정 시 섹션 숨김. */
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
  /** ICU `{percent}` 채워서 전달 (e.g., "92%의 매장에..."). */
  safetyStat2?: string;
  /** ICU `{min}` 채워서 전달. */
  safetyStat3?: string;
  safetyStat4?: string;
  safetySource?: string;
}

interface Props {
  locale: string;
  isAuthed: boolean;
  initialRegion: string;
  initialSearch: string;
  regions: string[];
  stores: PublicStore[];
  labels: CustomerLandingLabels;
  /** Sprint 2A: MOCK_FIXTURES=true 시 page.tsx에서 주입. 빈 배열이면 섹션 숨김. */
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
  const [region, setRegion] = useState(initialRegion);
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();
  const rotatedPlaceholder = useRotatedPlaceholder(
    labels.placeholders,
    labels.searchPlaceholder,
  );

  const navigate = (nextRegion: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextRegion) params.set("region", nextRegion);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/${locale}/c?${qs}` : `/${locale}/c`);
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hesya-peach-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 1000px 600px at 50% -100px, var(--hesya-peach-200), transparent 55%)",
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-5 pb-16 pt-6">
        <nav className="mb-8 flex items-center justify-between">
          <span className="font-heading text-[20px] font-semibold italic tracking-[-0.02em] text-hesya-navy-900">
            Hesya
          </span>
          <Link
            href={isAuthed ? `/${locale}/c/mypage` : `/${locale}/c/sign-in`}
            className="rounded-full bg-white/70 px-4 py-1.5 text-[12px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 hover:bg-white"
          >
            {isAuthed ? labels.mypage : labels.signIn}
          </Link>
        </nav>

        <header className="mb-7 max-w-2xl">
          <GreetingRotator />
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
              {labels.eyebrow}
            </p>
            <h1 className="font-heading text-[34px] font-semibold italic leading-[1.1] tracking-[-0.025em] text-hesya-navy-900 sm:text-[44px]">
              {labels.title}
            </h1>
            <p className="text-[14px] leading-relaxed text-hesya-navy-900/65 sm:text-[15px]">
              {labels.subtitle}
            </p>
          </div>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(region, search);
          }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 ring-1 ring-hesya-navy-900/10 focus-within:ring-2 focus-within:ring-hesya-amber-600/30">
            <span aria-hidden="true" className="text-hesya-navy-900/40">
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={rotatedPlaceholder}
              data-testid="landing-search-input"
              className="flex-1 bg-transparent text-[14px] text-hesya-navy-900 placeholder:text-hesya-navy-900/40 focus:outline-none"
            />
          </div>
        </form>

        {labels.moods.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-hesya-navy-900/55">
              {labels.moodLabel}
            </p>
            <div
              data-testid="landing-mood-row"
              className="flex flex-wrap gap-1.5"
            >
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-[12px] font-medium text-hesya-navy-900/80 ring-1 ring-hesya-navy-900/10 transition hover:bg-white"
                  >
                    <span aria-hidden="true">{icon}</span>
                    {text}
                  </button>
                );
              })}
            </div>
            {labels.liveRow && (
              <div
                data-testid="landing-live-row"
                className="mt-3 flex items-center gap-2 text-[11px] font-medium text-hesya-navy-900/55"
              >
                <span
                  aria-hidden="true"
                  className="relative inline-flex h-1.5 w-1.5"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {labels.liveRow}
              </div>
            )}
          </div>
        )}

        {labels.aiPhotoCta && labels.aiPhotoSubtitle && (
          <Link
            href={`/${locale}/c/photo-analyze`}
            data-testid="landing-photo-cta"
            className="mb-7 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-hesya-amber-100 to-hesya-peach-100 px-5 py-4 ring-1 ring-hesya-amber-600/20 transition hover:shadow-[0_8px_24px_-8px_rgba(216,139,91,0.25)]"
          >
            <span aria-hidden="true" className="text-[28px]" role="img">
              ✨
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-hesya-navy-900">
                {labels.aiPhotoCta}
              </p>
              <p className="text-[11.5px] text-hesya-navy-900/65">
                {labels.aiPhotoSubtitle}
              </p>
            </div>
            <span className="text-hesya-amber-600">→</span>
          </Link>
        )}

        <div className="mb-7">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-hesya-navy-900/55">
            {labels.regionLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={!region}
              onClick={() => {
                setRegion("");
                navigate("", search);
              }}
            >
              {labels.regionAll}
            </Chip>
            {regions.map((r) => (
              <Chip
                key={r}
                active={region === r}
                onClick={() => {
                  setRegion(r);
                  navigate(r, search);
                }}
              >
                📍 {r}
              </Chip>
            ))}
          </div>
        </div>

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

        {mockTrending && mockTrending.length > 0 && labels.trendingTitle && (
          <section data-testid="landing-trending" className="mt-12">
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

        {mockUGCCards && mockUGCCards.length > 0 && labels.ugcTitle && (
          <section data-testid="landing-ugc" className="mt-12">
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
            </div>
          </section>
        )}

        {mockReviews && mockReviews.length > 0 && labels.reviewsTitle && (
          <section data-testid="landing-reviews" className="mt-12">
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

        {labels.safetyTitle &&
          labels.safetyStat1 &&
          labels.safetyStat2 &&
          labels.safetyStat3 &&
          labels.safetyStat4 && (
            <section data-testid="landing-safety" className="mt-12">
              <div className="rounded-2xl bg-hesya-peach-100 px-5 py-5 ring-1 ring-hesya-amber-600/15">
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
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
        active
          ? "bg-hesya-navy-900 text-hesya-peach-50"
          : "bg-white/70 text-hesya-navy-900/70 ring-1 ring-hesya-navy-900/10 hover:bg-white"
      }`}
    >
      {children}
    </button>
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
  return (
    <Link
      href={`/${locale}/c/store/${store.id}`}
      // 동적 라우트 `/c/store/[id]` — default 'auto'는 layout만 prefetch.
      // prefetch={true}로 전체 RSC payload viewport-entry 시 prefetch.
      // 매장 60s unstable_cache hit이라 prefetch cost는 작음.
      prefetch
      className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-hesya-navy-900/10 transition hover:shadow-[0_8px_24px_-8px_rgba(26,34,56,0.15)]"
    >
      <div
        aria-hidden="true"
        className="aspect-[5/4] bg-gradient-to-br from-hesya-amber-200 via-hesya-amber-600 to-hesya-amber-800"
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
        {(showRating || verifiedBadge) && (
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
            <span className="ml-auto rounded-full bg-hesya-peach-100 px-2 py-0.5 text-[10.5px] font-semibold text-hesya-amber-600 ring-1 ring-hesya-amber-600/20">
              ★ {verifiedBadge}
            </span>
          </div>
        )}
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-hesya-amber-600 group-hover:underline">
          {viewLabel} →
        </p>
      </div>
    </Link>
  );
}
