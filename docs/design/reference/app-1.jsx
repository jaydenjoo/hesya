/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback } = React;

// --- Lucide-style icons (24px stroke=1.5) -----------------------------
const I =
  (paths, opts = {}) =>
  ({ size = 20, sw = 1.5, color = "currentColor", style }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {paths}
    </svg>
  );

const Icon = {
  search: I(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
  ),
  message: I(<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />),
  calendar: I(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>,
  ),
  card: I(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>,
  ),
  qr: I(
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M20 14v.01M14 20v.01M17 17v.01M20 17v.01M17 20v.01M20 20v.01" />
    </>,
  ),
  camera: I(
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="4" />
    </>,
  ),
  languages: I(
    <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />,
  ),
  scissors: I(
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </>,
  ),
  sparkles: I(
    <>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </>,
  ),
  shield: I(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  ),
  store: I(
    <>
      <path d="M2 7h20l-2 4H4z" />
      <path d="M4 11v9h16v-9M9 22v-6h6v6" />
    </>,
  ),
  bell: I(
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
  ),
  user: I(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>,
  ),
  chevR: I(<path d="m9 6 6 6-6 6" />),
  arrowUR: I(<path d="M7 7h10v10M7 17 17 7" />),
  image: I(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </>,
  ),
  alert: I(
    <>
      <path d="m21 16-9-14L3 16zM12 9v4M12 17h.01" />
    </>,
  ),
  check: I(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>,
  ),
  x: I(<path d="M18 6 6 18M6 6l12 12" />),
  filter: I(<path d="M22 3H2l8 9v7l4 2v-9z" />),
  more: I(
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>,
  ),
  globe: I(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </>,
  ),
  pin: I(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>,
  ),
  star: I(
    <path d="m12 2 3 7 7 .6-5.3 4.6 1.6 7-6.3-3.8-6.3 3.8 1.6-7L2 9.6 9 9z" />,
  ),
  menu: I(<path d="M3 6h18M3 12h18M3 18h18" />),
  plus: I(<path d="M12 5v14M5 12h14" />),
  minus: I(<path d="M5 12h14" />),
  eye: I(
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12" />
      <circle cx="12" cy="12" r="3" />
    </>,
  ),
  spinner: I(
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
  ),
  female: I(
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v7M9 19h6" />
    </>,
  ),
  sun: I(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>,
  ),
  inbox: I(
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11" />
    </>,
  ),
  layout: I(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>,
  ),
  users: I(
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M22 21a6 6 0 0 0-7-6" />
      <circle cx="17" cy="6" r="3" />
    </>,
  ),
  chart: I(<path d="M3 3v18h18M7 16l4-4 4 4 5-7" />),
  settings: I(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>,
  ),
  upload: I(
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  ),
  link: I(
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>,
  ),
};

// --- SECTION 1 — HERO ----------------------------------------------------
function Hero() {
  return (
    <section className="hero" id="s1">
      <div className="page hero-grid">
        <div>
          <h1 className="wordmark">Hesya</h1>
          <p className="hero-sub">The Korean welcome, in 5 languages.</p>
          <div className="lang-tags">
            <span className="lang-tag">한국의 환대</span>
            <span className="lang-tag">韓国のおもてなし</span>
            <span className="lang-tag">韩式款待</span>
            <span className="lang-tag">韓式款待</span>
            <span className="lang-tag">Sự đón tiếp Hàn Quốc</span>
          </div>
          <div className="hero-meta">
            <span>
              <strong>Design System</strong> · v1.0
            </span>
            <span>
              <strong>2026</strong> · April 30
            </span>
            <span>
              <strong>9 sections</strong> · 1 system
            </span>
          </div>
        </div>
        <div className="hero-motif">
          <HMotif />
        </div>
      </div>
    </section>
  );
}

function HMotif() {
  // ㅎ → H ink-stroke morph in soft amber
  return (
    <svg viewBox="0 0 460 460" aria-hidden="true">
      <defs>
        <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8A97A" />
          <stop offset="100%" stopColor="#D88B5B" />
        </linearGradient>
      </defs>
      {/* faint background circle for stage */}
      <circle
        cx="230"
        cy="230"
        r="200"
        fill="none"
        stroke="rgba(232,169,122,0.18)"
        strokeWidth="1"
      />
      {/* ㅎ glyph - left */}
      <g stroke="url(#ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        {/* top stroke */}
        <path d="M85 110 L165 110" />
        {/* vertical hat */}
        <path d="M125 80 L125 130" />
        {/* circle */}
        <circle cx="125" cy="195" r="48" strokeWidth="3" />
      </g>
      {/* arrow / morph trail */}
      <g
        stroke="rgba(216,139,91,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="2 6"
      >
        <path d="M195 195 Q260 145 320 195" />
      </g>
      {/* H glyph - right, italic-leaning */}
      <g stroke="url(#ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M310 145 L290 320" />
        <path d="M395 135 L375 310" />
        <path d="M298 220 L387 220" />
      </g>
      {/* drift accent */}
      <circle cx="346" cy="350" r="3" fill="#E8A97A" />
      <circle cx="100" cy="345" r="2" fill="#D88B5B" />
      <circle cx="395" cy="80" r="2.5" fill="#E8A97A" />
    </svg>
  );
}

// --- SECTION 2 — COLORS --------------------------------------------------
const brandColors = [
  {
    v: "--hesya-peach-50",
    hex: "#FDF8F1",
    name: "Warm Cream",
    use: "page background",
    textDark: false,
  },
  {
    v: "--hesya-peach-100",
    hex: "#F8E9D9",
    name: "Petal",
    use: "section background",
    textDark: false,
  },
  {
    v: "--hesya-peach-200",
    hex: "#F5DDC8",
    name: "Peachy Nude",
    use: "brand wash, hero",
    textDark: false,
  },
  {
    v: "--hesya-amber-500",
    hex: "#E8A97A",
    name: "Soft Amber",
    use: "CTA, accent",
    textDark: false,
  },
  {
    v: "--hesya-amber-600",
    hex: "#D88B5B",
    name: "Amber Hover",
    use: "CTA hover",
    textDark: false,
  },
  {
    v: "--hesya-navy-900",
    hex: "#1A2238",
    name: "Deep Hesya Navy",
    use: "headlines, body",
    textDark: true,
  },
];
const semanticColors = [
  {
    v: "--semantic-success",
    hex: "#2A9D5C",
    name: "Verified Green",
    use: "KYC pass, payment ok",
    textDark: true,
  },
  {
    v: "--semantic-warning",
    hex: "#E8A117",
    name: "Caution Amber",
    use: "manual review needed",
    textDark: false,
  },
  {
    v: "--semantic-danger",
    hex: "#DC3545",
    name: "Critical Red",
    use: "KYC reject, refund",
    textDark: true,
  },
  {
    v: "--semantic-info",
    hex: "#5B9BD5",
    name: "Info Sky",
    use: "AI translating",
    textDark: true,
  },
];
const neutralColors = [
  {
    v: "--gray-50",
    hex: "#FAFBFC",
    name: "Gray 50",
    use: "surface alt",
    textDark: false,
  },
  {
    v: "--gray-100",
    hex: "#F1F3F5",
    name: "Gray 100",
    use: "borders, dividers",
    textDark: false,
  },
  {
    v: "--gray-300",
    hex: "#ADB5BD",
    name: "Gray 300",
    use: "placeholder text",
    textDark: false,
  },
  {
    v: "--gray-500",
    hex: "#6C757D",
    name: "Gray 500",
    use: "secondary text",
    textDark: true,
  },
  {
    v: "--gray-700",
    hex: "#3D4551",
    name: "Gray 700",
    use: "body on cream",
    textDark: true,
  },
  {
    v: "--gray-900",
    hex: "#1A1E24",
    name: "Gray 900",
    use: "max contrast",
    textDark: true,
  },
];
const darkBrand = [
  {
    v: "--gray-900",
    hex: "#1A1E24",
    name: "Background",
    use: "page bg",
    textDark: true,
  },
  {
    v: "--gray-800",
    hex: "#2B3038",
    name: "Surface",
    use: "cards, sheets",
    textDark: true,
  },
  {
    v: "--peach-100-dk",
    hex: "#FBE4D0",
    name: "Petal (warm shift)",
    use: "section bg",
    textDark: false,
  },
  {
    v: "--amber-500-dk",
    hex: "#EFB489",
    name: "Soft Amber +1",
    use: "CTA on dark",
    textDark: false,
  },
  {
    v: "--amber-600-dk",
    hex: "#E29A6D",
    name: "Amber Hover +1",
    use: "CTA hover dark",
    textDark: false,
  },
  {
    v: "--peach-50-dk",
    hex: "#FCEFDF",
    name: "Cream (warm shift)",
    use: "headline on dark",
    textDark: false,
  },
];

function Swatch({ c }) {
  return (
    <div className="swatch">
      <div className="swatch-chip" style={{ background: c.hex }}>
        <span className={"hex" + (c.textDark ? " on-light" : "")}>{c.hex}</span>
      </div>
      <div className="swatch-meta">
        <div className="name">{c.name}</div>
        <div className="var">{c.v}</div>
        <div className="use">{c.use}</div>
      </div>
    </div>
  );
}

function ColorRow({ title, subtitle, colors }) {
  return (
    <div className="color-row">
      <div className="color-row-title">
        <h3>{title}</h3>
        <span className="desc">{subtitle}</span>
      </div>
      <div className="swatch-grid">
        {colors.map((c, i) => (
          <Swatch key={i} c={c} />
        ))}
      </div>
    </div>
  );
}

function Section2() {
  return (
    <section className="ds-section" id="s2">
      <div className="page">
        <SectionHead
          num="02"
          eyebrow="Color"
          title={
            <>
              Tokens that <em>warm without raising</em> their voice.
            </>
          }
          desc="Brand peach + amber is the soul. Semantic colors carry function. Neutrals do the work. Dark mode is provided as a complete companion theme — accents shift one step warmer to compensate."
        />
        <ColorRow
          title="Brand"
          subtitle="The soul of Hesya — peach, amber, navy"
          colors={brandColors}
        />
        <ColorRow
          title="Semantic"
          subtitle="Status, KYC, AI signal"
          colors={semanticColors}
        />
        <ColorRow
          title="Neutrals"
          subtitle="Surfaces, borders, body text"
          colors={neutralColors}
        />

        <div className="sub-label" style={{ marginTop: 64 }}>
          Light & Dark companion
        </div>
        <div className="color-modes">
          <div className="mode-frame light">
            <div className="mode-label">◐ Light Mode</div>
            <div className="swatch-grid">
              {brandColors.slice(0, 6).map((c, i) => (
                <Swatch key={i} c={c} />
              ))}
            </div>
          </div>
          <div className="mode-frame dark">
            <div className="mode-label">● Dark Mode</div>
            <div className="swatch-grid">
              {darkBrand.map((c, i) => (
                <Swatch key={i} c={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- SECTION 3 — TYPE ----------------------------------------------------
const typeRows = [
  {
    l: "d1",
    spec: "72/76 · -0.03em",
    kr: "한국이 외국인에게 건네는 첫 인사",
    en: "Hesya — your salon's new front door",
    size: 72,
    lh: 76,
    ls: -0.03,
  },
  {
    l: "d2",
    spec: "56/60 · -0.03em",
    kr: "예약부터 결제, 5개 언어 자동 번역",
    en: "Page hero — booking, payments, five tongues",
    size: 56,
    lh: 60,
    ls: -0.03,
  },
  {
    l: "d3",
    spec: "40/44 · -0.02em",
    kr: "여행자가 처음 만나는 매장",
    en: "Section hero — the first storefront a traveler meets",
    size: 40,
    lh: 44,
    ls: -0.02,
  },
  {
    l: "h1",
    spec: "32/40 · -0.02em",
    kr: "오늘의 예약 17건",
    en: "Page title — 17 bookings today",
    size: 32,
    lh: 40,
    ls: -0.02,
  },
  {
    l: "h2",
    spec: "24/32 · -0.01em",
    kr: "오시는 길 안내",
    en: "Card title — getting here",
    size: 24,
    lh: 32,
    ls: -0.01,
  },
  {
    l: "h3",
    spec: "20/28 · 0",
    kr: "디자이너 김지윤",
    en: "Dense card title — stylist Jiyoon",
    size: 20,
    lh: 28,
    ls: 0,
  },
];
const bodyRows = [
  {
    l: "body-lg",
    spec: "18/28 · 0.01em",
    kr: "K-뷰티 시술이 처음이신가요? Hesya가 통역과 안내를 맡습니다.",
    en: "First time with K-beauty? Hesya translates and guides you through.",
    size: 18,
    lh: 28,
    ls: 0.01,
  },
  {
    l: "body",
    spec: "16/26 · 0.01em",
    kr: "예약 시간 10분 전에 매장에 도착해 주세요.",
    en: "Arrive 10 minutes before your booking. The default body line-height is 1.625.",
    size: 16,
    lh: 26,
    ls: 0.01,
  },
  {
    l: "body-sm",
    spec: "14/22 · 0.02em",
    kr: "VAT 포함 · 결제 후 환불 정책 적용",
    en: "VAT included · refund policy applies after payment",
    size: 14,
    lh: 22,
    ls: 0.02,
  },
  {
    l: "caption",
    spec: "12/18 · 0.04em",
    kr: "결제 완료 / 영수증",
    en: "PAYMENT CONFIRMED / RECEIPT",
    size: 12,
    lh: 18,
    ls: 0.04,
  },
];

function TypeSpec({ r, isCaption }) {
  return (
    <div className="type-spec">
      <div className="label">{r.l}</div>
      <div className="specs">
        {r.spec}
        <br />
        {r.l.startsWith("d") || r.l.startsWith("h")
          ? "Fraunces 600 / Pretendard 600"
          : "Source Sans 3 / Pretendard 400"}
      </div>
      <div className="sample-stack">
        <div
          className="kr-line kr"
          style={{
            fontFamily: "var(--font-body-kr)",
            fontWeight: r.l.startsWith("d") || r.l.startsWith("h") ? 600 : 400,
            fontSize:
              r.l.startsWith("d") || r.l.startsWith("h")
                ? `${r.size * 0.78}px`
                : `${r.size}px`,
            lineHeight: 1.8,
            letterSpacing: r.ls > 0.02 ? "0.02em" : `${r.ls}em`,
          }}
        >
          {r.kr}
        </div>
        <div
          className="en-line"
          style={{
            fontFamily:
              r.l.startsWith("d") || r.l.startsWith("h")
                ? "var(--font-display)"
                : "var(--font-body-en)",
            fontStyle: r.l.startsWith("d") ? "italic" : "normal",
            fontWeight: r.l.startsWith("d") || r.l.startsWith("h") ? 600 : 400,
            fontSize: `${r.size}px`,
            lineHeight: `${r.lh}px`,
            letterSpacing: `${r.ls}em`,
            textTransform: isCaption ? "uppercase" : "none",
          }}
        >
          {r.en}
        </div>
      </div>
    </div>
  );
}

function Section3() {
  return (
    <section className="ds-section" id="s3">
      <div className="page">
        <SectionHead
          num="03"
          eyebrow="Typography"
          title={
            <>
              Two scripts, <em>one breath</em>.
            </>
          }
          desc="Fraunces sets the editorial English voice (italic accents make warmth visible). Pretendard handles Korean with the line-height and word-break rules Korean readers expect. Source Sans 3 carries body English. JetBrains Mono carries numbers."
        />
        <div className="sub-label">Display</div>
        <div className="matrix" style={{ marginBottom: 32 }}>
          {typeRows.map((r, i) => (
            <TypeSpec key={i} r={r} />
          ))}
        </div>
        <div className="sub-label">Body</div>
        <div className="matrix" style={{ marginBottom: 48 }}>
          {bodyRows.map((r, i) => (
            <TypeSpec key={i} r={r} isCaption={r.l === "caption"} />
          ))}
        </div>

        <div className="sub-label">Mono</div>
        <div className="matrix" style={{ marginBottom: 48 }}>
          <div className="type-spec">
            <div className="label">mono</div>
            <div className="specs">
              JetBrains Mono · tnum
              <br />
              Numbers, IDs, code
            </div>
            <div className="sample-stack">
              <div
                className="mono"
                style={{ fontSize: 28, color: "var(--hesya-navy-900)" }}
              >
                ₩ 145,000 · KRW 145,000
              </div>
              <div
                className="mono"
                style={{ fontSize: 14, color: "var(--gray-500)" }}
              >
                booking_id: HSY-2026-04-30-A472 · +82 70 4321 0099
              </div>
            </div>
          </div>
        </div>

        <div className="sub-label">Korean rules</div>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div className="callout-warn">
            <span className="ico">⚠</span>
            <div>
              <b>
                NEVER apply <code>text-transform: uppercase</code> to Korean
                characters.
              </b>
              <br />
              한글에는 대문자 개념이 없습니다. 영문 캡션에만 사용.
            </div>
          </div>
          <div className="callout-warn">
            <span className="ico">⚠</span>
            <div>
              <b>
                NEVER use <code>letter-spacing</code> &gt; 0.02em on Korean.
              </b>
              <br />
              자간이 넓어지면 가독성이 무너집니다.
            </div>
          </div>
          <div className="callout-warn">
            <span className="ico">⚠</span>
            <div>
              <b>
                Korean headlines should be 20–30% smaller than English
                equivalents.
              </b>
              <br />
              한글 글자는 본질적으로 더 크게 보입니다. 시각 보정 필수.
            </div>
          </div>
          <div className="callout-warn">
            <span className="ico">⚠</span>
            <div>
              <b>
                All Korean body text uses <code>word-break: keep-all</code> and{" "}
                <code>line-height: 1.8</code>.
              </b>
              <br />
              띄어쓰기 단위로 줄바꿈해야 자연스럽습니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- SECTION 4 — SPACING / RADIUS / SHADOW / MOTION ----------------------
const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
const radii = [
  { v: "--r-sm", val: 8, use: "buttons, badges" },
  { v: "--r-md", val: 12, use: "inputs, small cards" },
  { v: "--r-lg", val: 16, use: "cards" },
  { v: "--r-xl", val: 20, use: "feature cards" },
  { v: "--r-2xl", val: 24, use: "modal, sheet" },
  { v: "--r-full", val: 9999, use: "pill, avatar" },
];
const shadowLevels = [
  { v: "--shadow-0", lvl: "0", use: "flat surface" },
  { v: "--shadow-1", lvl: "1", use: "input" },
  { v: "--shadow-2", lvl: "2", use: "card" },
  { v: "--shadow-3", lvl: "3", use: "modal" },
  { v: "--shadow-4", lvl: "4", use: "hero CTA" },
];

function Section4() {
  return (
    <section className="ds-section" id="s4">
      <div className="page">
        <SectionHead
          num="04"
          eyebrow="Space · Radius · Shadow · Motion"
          title={
            <>
              The <em>quiet rules</em> behind every surface.
            </>
          }
          desc="A 4-px base scale, six radius tokens, five elevation tiers (always 2-layer composites), and three motion durations."
        />

        <div className="sub-label">Spacing — 4px base</div>
        <div className="spacing-ruler">
          {spacingScale.map((s) => (
            <div className="ruler-row" key={s}>
              <span className="num">{s}</span>
              <span
                className="bar"
                style={{ width: `${Math.min(s, 256)}px` }}
              ></span>
              <span className="px">{s}px</span>
            </div>
          ))}
        </div>

        <div className="sub-label" style={{ marginTop: 64 }}>
          Radius
        </div>
        <div className="radius-grid">
          {radii.map((r) => (
            <div className="radius-cell" key={r.v}>
              <div
                className="radius-shape"
                style={{
                  borderRadius: r.val === 9999 ? "9999px" : `${r.val}px`,
                }}
              ></div>
              <div className="name">{r.v}</div>
              <div className="use">{r.use}</div>
            </div>
          ))}
        </div>

        <div className="sub-label" style={{ marginTop: 64 }}>
          Shadow — 2-layer composites
        </div>
        <div className="shadow-stack">
          {shadowLevels.map((s) => (
            <div
              key={s.v}
              className="shadow-card"
              style={{ boxShadow: `var(${s.v})` }}
            >
              <div className="label">{s.v}</div>
              <div className="level">{s.lvl}</div>
              <div className="use">{s.use}</div>
            </div>
          ))}
        </div>

        <div className="sub-label" style={{ marginTop: 64 }}>
          Motion — durations & easings
        </div>
        <div className="motion-grid">
          <div className="motion-card fast">
            <div className="name">--duration-fast</div>
            <div className="val">120ms · standard</div>
            <div className="demo">
              <div className="puck" />
            </div>
          </div>
          <div className="motion-card">
            <div className="name">--duration-normal</div>
            <div className="val">220ms · standard</div>
            <div className="demo">
              <div className="puck" />
            </div>
          </div>
          <div className="motion-card slow">
            <div className="name">--duration-slow</div>
            <div className="val">420ms · standard</div>
            <div className="demo">
              <div className="puck" />
            </div>
          </div>
          <div className="motion-card spring">
            <div className="name">--easing-spring</div>
            <div className="val">cubic-bezier(0.34, 1.56, 0.64, 1)</div>
            <div className="demo">
              <div className="puck" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="code-block">{`@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
  *, *::before, *::after {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}`}</div>
        </div>
      </div>
    </section>
  );
}

// --- SECTION HEAD HELPER -------------------------------------------------
function SectionHead({ num, eyebrow, title, desc }) {
  return (
    <header className="section-head">
      <div className="section-num">{num}</div>
      <div className="meta">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </header>
  );
}

window.__hesyaIcons = Icon;
window.Hero = Hero;
window.Section2 = Section2;
window.Section3 = Section3;
window.Section4 = Section4;
window.SectionHead = SectionHead;
