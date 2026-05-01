import "@/styles/handoff/tokens.css";
import "@/styles/handoff/components.css";

import type { ReactNode } from "react";

import { Icon } from "./_icons";
import { Section5 } from "./_section-5";

// Handoff v1.0 1:1 reproduction of docs/design/handoff/Hesya Design System.html
// Sources: app-1.jsx (Hero + Sections 2–4), app-2.jsx (Section 5),
// app-3.jsx (Sections 6–9), components.css for the visual layer.
// Sections 8–10 land in follow-up commits.

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

type ColorTok = (typeof brandColors)[number];

type TypeRow = {
  l: string;
  spec: string;
  kr: string;
  en: string;
  size: number;
  lh: number;
  ls: number;
};

const typeRows: TypeRow[] = [
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

const bodyRows: TypeRow[] = [
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

function HMotif() {
  return (
    <svg viewBox="0 0 460 460" aria-hidden="true">
      <defs>
        <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8A97A" />
          <stop offset="100%" stopColor="#D88B5B" />
        </linearGradient>
      </defs>
      <circle
        cx="230"
        cy="230"
        r="200"
        fill="none"
        stroke="rgba(232,169,122,0.18)"
        strokeWidth="1"
      />
      <g stroke="url(#ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M85 110 L165 110" />
        <path d="M125 80 L125 130" />
        <circle cx="125" cy="195" r="48" strokeWidth="3" />
      </g>
      <g
        stroke="rgba(216,139,91,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="2 6"
      >
        <path d="M195 195 Q260 145 320 195" />
      </g>
      <g stroke="url(#ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M310 145 L290 320" />
        <path d="M395 135 L375 310" />
        <path d="M298 220 L387 220" />
      </g>
      <circle cx="346" cy="350" r="3" fill="#E8A97A" />
      <circle cx="100" cy="345" r="2" fill="#D88B5B" />
      <circle cx="395" cy="80" r="2.5" fill="#E8A97A" />
    </svg>
  );
}

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

function Swatch({ c }: { c: ColorTok }) {
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

function ColorRow({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle: string;
  colors: ColorTok[];
}) {
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

function SectionHead({
  num,
  eyebrow,
  title,
  desc,
}: {
  num: string;
  eyebrow: string;
  title: ReactNode;
  desc: string;
}) {
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

function TypeSpec({ r, isCaption }: { r: TypeRow; isCaption?: boolean }) {
  const isDisplayLike = r.l.startsWith("d") || r.l.startsWith("h");
  return (
    <div className="type-spec">
      <div className="label">{r.l}</div>
      <div className="specs">
        {r.spec}
        <br />
        {isDisplayLike
          ? "Fraunces 600 / Pretendard 600"
          : "Source Sans 3 / Pretendard 400"}
      </div>
      <div className="sample-stack">
        <div
          className="kr-line kr"
          style={{
            fontFamily: "var(--font-body-kr)",
            fontWeight: isDisplayLike ? 600 : 400,
            fontSize: isDisplayLike ? `${r.size * 0.78}px` : `${r.size}px`,
            lineHeight: 1.8,
            letterSpacing: r.ls > 0.02 ? "0.02em" : `${r.ls}em`,
          }}
        >
          {r.kr}
        </div>
        <div
          className="en-line"
          style={{
            fontFamily: isDisplayLike
              ? "var(--font-display)"
              : "var(--font-body-en)",
            fontStyle: r.l.startsWith("d") ? "italic" : "normal",
            fontWeight: isDisplayLike ? 600 : 400,
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
          <pre className="code-block">{`@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
  *, *::before, *::after {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}`}</pre>
        </div>
      </div>
    </section>
  );
}

// --- SECTION 6 — ICONOGRAPHY (handoff app-3.jsx) -----------------------
const section6IconList = [
  "search",
  "message",
  "calendar",
  "card",
  "qr",
  "camera",
  "languages",
  "scissors",
  "sparkles",
  "shield",
  "store",
  "bell",
  "user",
  "chevR",
  "arrowUR",
  "image",
  "alert",
  "check",
  "x",
  "filter",
  "more",
  "globe",
  "pin",
  "star",
] as const;

const section6Labels: Record<(typeof section6IconList)[number], string> = {
  search: "search",
  message: "message-circle",
  calendar: "calendar",
  card: "credit-card",
  qr: "qr-code",
  camera: "camera",
  languages: "languages",
  scissors: "scissors",
  sparkles: "sparkles",
  shield: "shield-check",
  store: "store",
  bell: "bell",
  user: "user",
  chevR: "chevron-right",
  arrowUR: "arrow-up-right",
  image: "image",
  alert: "alert-triangle",
  check: "check-circle",
  x: "x",
  filter: "filter",
  more: "more-horizontal",
  globe: "globe",
  pin: "map-pin",
  star: "star",
};

function Section6() {
  return (
    <section className="ds-section" id="s6">
      <div className="page">
        <SectionHead
          num="06"
          eyebrow="Iconography"
          title={
            <>
              Lucide, <em>set quietly</em>.
            </>
          }
          desc="Stroke 1.5 default · 2 for emphasis. Color inherits. No filled icons. No emoji in product UI."
        />
        <div className="icon-grid">
          {section6IconList.map((k) => {
            const Ic = Icon[k];
            return (
              <div className="icon-cell" key={k}>
                <Ic size={24} sw={1.5} />
                <span className="name">{section6Labels[k]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- SECTION 7 — IMAGERY (handoff app-3.jsx) ---------------------------
function Section7() {
  return (
    <section className="ds-section" id="s7">
      <div className="page">
        <SectionHead
          num="07"
          eyebrow="Imagery & Illustration"
          title={
            <>
              Editorial warmth, <em>not stock smiles</em>.
            </>
          }
          desc="Salon photography is warm-toned editorial. Empty states are hand-drawn ink. Avoid the uncanny."
        />

        <div className="sub-label">Salon photography · warm-cream filter</div>
        <div className="img-row">
          <div
            className="salon-photo"
            style={{
              background:
                "linear-gradient(135deg, #F5DDC8 0%, #D88B5B 60%, #1A2238 130%)",
            }}
          />
          <div
            className="salon-photo"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #F8E9D9, #E8A97A 60%, #3D4551)",
            }}
          />
          <div
            className="salon-photo"
            style={{
              background:
                "linear-gradient(160deg, #FDF8F1 0%, #F5DDC8 40%, #D88B5B 100%)",
            }}
          />
        </div>

        <div className="sub-label" style={{ marginTop: 64 }}>
          Empty states · ink + amber
        </div>
        <div className="empty-row">
          <div className="empty-card">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              <rect
                x="20"
                y="22"
                width="80"
                height="48"
                rx="4"
                stroke="#1A2238"
                strokeWidth="1.5"
              />
              <path d="M20 36h80" stroke="#1A2238" strokeWidth="1.5" />
              <path d="M34 22v-6M86 22v-6" stroke="#E8A97A" strokeWidth="2" />
              <circle
                cx="60"
                cy="54"
                r="10"
                fill="none"
                stroke="#E8A97A"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
            </svg>
            <h5>No bookings yet</h5>
            <p className="kr">아직 예약이 없어요. 첫 손님을 기다리는 중.</p>
          </div>
          <div className="empty-card">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              <rect
                x="30"
                y="14"
                width="60"
                height="52"
                rx="4"
                stroke="#1A2238"
                strokeWidth="1.5"
              />
              <circle cx="60" cy="36" r="6" stroke="#E8A97A" strokeWidth="2" />
              <path
                d="m54 30 12 12M66 30 54 42"
                stroke="#E8A97A"
                strokeWidth="2"
              />
              <path
                d="M40 56h40"
                stroke="#1A2238"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
              <path d="m100 20 4 4 4-4" stroke="#E8A97A" strokeWidth="2" />
              <path d="M104 24v-8" stroke="#E8A97A" strokeWidth="2" />
            </svg>
            <h5>AI is analyzing your photo</h5>
            <p className="kr">사진을 분석하고 있어요…</p>
          </div>
          <div className="empty-card">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              <path
                d="M30 30c0-6 5-12 14-12h12c9 0 14 6 14 12v14c0 6-5 12-14 12h-4l-8 6v-6h-2c-9 0-14-6-14-12z"
                stroke="#1A2238"
                strokeWidth="1.5"
              />
              <circle cx="46" cy="36" r="1.5" fill="#E8A97A" />
              <circle cx="56" cy="36" r="1.5" fill="#E8A97A" />
              <circle cx="66" cy="36" r="1.5" fill="#E8A97A" />
              <path
                d="M86 26c4 4 4 14 0 18"
                stroke="#E8A97A"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
            </svg>
            <h5>Inbox is quiet</h5>
            <p className="kr">받은 메시지가 없어요. 평화로운 오후입니다.</p>
          </div>
        </div>

        <div className="donts">
          <b>Avoid:</b> clip-art beauty mannequins · generic stock-smile
          portraits · AI-generated uncanny faces · glitter stickers · cute
          mascots · &quot;✨AI Powered✨&quot; badges anywhere.
        </div>
      </div>
    </section>
  );
}

function JumpBar() {
  const items = [
    { num: "01", label: "Brand", href: "#s1" },
    { num: "02", label: "Color", href: "#s2" },
    { num: "03", label: "Type", href: "#s3" },
    { num: "04", label: "Space", href: "#s4" },
    { num: "05", label: "Components", href: "#s5" },
    { num: "06", label: "Icons", href: "#s6" },
    { num: "07", label: "Imagery", href: "#s7" },
    { num: "08", label: "Grid", href: "#s8" },
    { num: "09", label: "A11y", href: "#s9" },
    { num: "10", label: "Female lens", href: "#s10" },
  ];
  return (
    <nav className="jumpbar" aria-label="Section navigation">
      <div className="jumpbar-inner">
        <span className="jumpbar-brand">Hesya</span>
        {items.map((i) => (
          <a key={i.num} href={i.href}>
            <span className="num">{i.num}</span> {i.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <JumpBar />
      <Hero />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
      <Section7 />
      <footer className="ds-footer">
        <div className="page">
          <div className="caption">
            Hesya Design System v1.0 · 2026-04-30 · The Korean welcome, in 5
            languages.
          </div>
        </div>
      </footer>
    </>
  );
}
