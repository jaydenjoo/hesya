"use client";

/**
 * Plan v3 M4.5 — customer 랜딩 Client 컴포넌트.
 *
 * region chip / search input은 URL 쿼리 동기화 (?region= / ?q=). useTransition + router.push로
 * SSR 갱신 — 페이지 진입 시 검색 결과 SEO friendly.
 *
 * 디자인: peach 배경 + amber accent + Fraunces 헤딩 (기존 /c/* 일관성).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { PublicStore } from "@/shared/lib/dal/stores";

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
  regionLabel: string;
  regionAll: string;
  resultsCount: string;
  emptyTitle: string;
  emptySubtitle: string;
  signIn: string;
  mypage: string;
  viewStore: string;
}

interface Props {
  locale: string;
  isAuthed: boolean;
  initialRegion: string;
  initialSearch: string;
  regions: string[];
  stores: PublicStore[];
  labels: CustomerLandingLabels;
}

export function CustomerLanding({
  locale,
  isAuthed,
  initialRegion,
  initialSearch,
  regions,
  stores,
  labels,
}: Props) {
  const router = useRouter();
  const [region, setRegion] = useState(initialRegion);
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();

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
              placeholder={labels.searchPlaceholder}
              className="flex-1 bg-transparent text-[14px] text-hesya-navy-900 placeholder:text-hesya-navy-900/40 focus:outline-none"
            />
          </div>
        </form>

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
                />
              ))}
            </div>
          </>
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
}: {
  store: PublicStore;
  locale: string;
  viewLabel: string;
}) {
  return (
    <Link
      href={`/${locale}/c/store/${store.id}`}
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
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-hesya-amber-600 group-hover:underline">
          {viewLabel} →
        </p>
      </div>
    </Link>
  );
}
