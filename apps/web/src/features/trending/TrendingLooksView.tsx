"use client";

/**
 * Trending Looks — 이번 달 한국 K-뷰티 인기 시술 8개.
 * Reference: docs/design/reference/Hesya Trending Looks.html
 *
 * 공통 컴포넌트 — /[locale]/trending (마케팅) + /[locale]/c/trending (고객) 양쪽 사용.
 * 베타: 8개 mock 시술, 카테고리 chip 필터.
 */

import { useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

type Cat = "all" | "hair" | "nail" | "makeup" | "skin" | "brow";

type Look = {
  rank: number;
  bg: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  cat: Exclude<Cat, "all">;
  nameKo: string;
  nameEn: string;
  desc: string;
  priceRange: string;
  duration: string;
  trendDelta: string;
};

const LOOKS: Look[] = [
  {
    rank: 1,
    bg: 1,
    cat: "hair",
    nameKo: "투명 윤곽 컷",
    nameEn: "Soft Layered Cut",
    desc: "얼굴선을 살리는 가벼운 레이어. K-드라마 여주인공 룩.",
    priceRange: "₩55,000~",
    duration: "60–90 min",
    trendDelta: "+38%",
  },
  {
    rank: 2,
    bg: 2,
    cat: "makeup",
    nameKo: "글래스 스킨",
    nameEn: "Glass Skin Makeup",
    desc: "촉촉하고 투명한 한국 미용 메이크업의 정수.",
    priceRange: "₩45,000~",
    duration: "45–60 min",
    trendDelta: "+32%",
  },
  {
    rank: 3,
    bg: 3,
    cat: "hair",
    nameKo: "히메컷",
    nameEn: "Hime Side-Frame Cut",
    desc: "옆선 액자 컷 — J/K 양쪽 인기 폭발.",
    priceRange: "₩60,000~",
    duration: "75 min",
    trendDelta: "+28%",
  },
  {
    rank: 4,
    bg: 4,
    cat: "hair",
    nameKo: "발레아쥬 컬러",
    nameEn: "Balayage Highlight",
    desc: "자연스러운 그라데이션 — 깊이감 있는 톤.",
    priceRange: "₩180,000~",
    duration: "180 min",
    trendDelta: "+24%",
  },
  {
    rank: 5,
    bg: 5,
    cat: "nail",
    nameKo: "젤리 네일",
    nameEn: "Jelly Nail",
    desc: "투명+컬러 layered glow. 3D 매그넷 디자인.",
    priceRange: "₩70,000~",
    duration: "120 min",
    trendDelta: "+22%",
  },
  {
    rank: 6,
    bg: 6,
    cat: "makeup",
    nameKo: "래쉬 펌",
    nameEn: "Lash Lift",
    desc: "내츄럴 컬업. 6주 지속, 노 마스카라.",
    priceRange: "₩50,000~",
    duration: "60 min",
    trendDelta: "+18%",
  },
  {
    rank: 7,
    bg: 7,
    cat: "skin",
    nameKo: "산 필링",
    nameEn: "Mild Acid Peel",
    desc: "피부톤 정돈 + 모공 케어. PHA 산.",
    priceRange: "₩90,000~",
    duration: "75 min",
    trendDelta: "+15%",
  },
  {
    rank: 8,
    bg: 8,
    cat: "brow",
    nameKo: "자연 눈썹 정리",
    nameEn: "Soft Brow Shape",
    desc: "잔디 결 wax + 컬러. 무광 자연 마무리.",
    priceRange: "₩35,000~",
    duration: "30 min",
    trendDelta: "+12%",
  },
];

const FILTERS: { key: Cat; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "hair", label: "헤어" },
  { key: "nail", label: "네일" },
  { key: "makeup", label: "메이크업" },
  { key: "skin", label: "스킨" },
  { key: "brow", label: "눈썹" },
];

export function TrendingLooksView({ ctaHref }: { ctaHref?: string }) {
  const [active, setActive] = useState<Cat>("all");
  const visible = useMemo(
    () => (active === "all" ? LOOKS : LOOKS.filter((l) => l.cat === active)),
    [active],
  );

  return (
    <div className="trending-page">
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <Link className="brand" href="/" aria-label="Hesya — 홈으로">
            Hesya<span className="brand-pill">·KR</span>
          </Link>
          <nav className="top-links" aria-label="주 메뉴">
            <Link href="/">제품</Link>
            <Link href="/pricing">요금제</Link>
            <Link href="/trending" aria-current="page">
              Trending
            </Link>
            <Link href="/c">매장 찾기</Link>
          </nav>
          <div className="top-right">
            <Link
              href="/c"
              className="chip"
              style={{ background: "#1A2238", color: "#FDF8F1" }}
              lang="ko"
            >
              매장 보기 →
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero-wrap">
            <div className="eyebrow">TRENDING · {new Date().getFullYear()}</div>
            <h1 id="hero-h">
              <span className="ko" lang="ko">
                이번 달 한국에서
              </span>
              <span className="ko" lang="ko">
                사람들이 한 것
              </span>
            </h1>
            <p className="sub" lang="ko">
              외국인 손님 예약 빈도 기준, 이번 달 가장 인기 있는 K-뷰티 시술
              8가지. 비슷한 시술을 하는 K-Verified 매장도 함께 추천드립니다.
            </p>
          </div>
        </section>

        <section className="filter-bar" aria-label="카테고리 필터">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="chip"
              aria-pressed={active === f.key}
              onClick={() => setActive(f.key)}
            >
              <span lang="ko">{f.label}</span>
            </button>
          ))}
        </section>

        <section className="grid-wrap" aria-labelledby="grid-h">
          <h2 className="section-h" id="grid-h">
            <span className="ko" lang="ko">
              Top 8 · 이번 달
            </span>
          </h2>
          <div className="grid">
            {visible.map((l) => (
              <article key={l.rank} className="look">
                <div className={`cover bg-${l.bg}`} aria-hidden="true">
                  <span className="rank" aria-label={`Rank ${l.rank}`}>
                    #{l.rank}
                  </span>
                  <span className="trend-pill">{l.trendDelta}</span>
                </div>
                <div className="body">
                  <h3>
                    <span lang="ko">{l.nameKo}</span>
                    <span className="en">{l.nameEn}</span>
                  </h3>
                  <p className="desc" lang="ko">
                    {l.desc}
                  </p>
                  <div className="meta">
                    <span className="price">{l.priceRange}</span>
                    <span>·</span>
                    <span>{l.duration}</span>
                  </div>
                  <div className="cta">
                    <Link
                      href={ctaHref ?? "/c"}
                      lang="ko"
                      aria-label={`${l.nameKo} 시술하는 매장 찾기`}
                    >
                      비슷한 시술 찾기 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="footer-cta" aria-labelledby="fcta-h">
          <h2 id="fcta-h">
            <span className="ko" lang="ko">
              나에게 맞는 시술, 어떻게 시작할까요?
            </span>
          </h2>
          <div className="row">
            <Link href="/c/photo-analyze" className="btn primary" lang="ko">
              사진으로 AI 추천받기
            </Link>
            <Link href="/c" className="btn ghost" lang="ko">
              매장 둘러보기
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-wrap">
          <span>© 2026 Hesya · KR · GDPR · 개인정보보호법 준수</span>
          <Link href="/cancellation-policy">취소/환불 정책</Link>
        </div>
      </footer>
    </div>
  );
}
