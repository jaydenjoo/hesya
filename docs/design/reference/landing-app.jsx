/* global React */
const { useState, useEffect, useRef } = React;
const Icon = window.__hesyaIcons;

const greetings = [
  { lang: "en", text: "Welcome to Korea.", kr: false },
  { lang: "ko", text: "한국에 오신 것을 환영합니다.", kr: true },
  { lang: "ja", text: "韓国へようこそ。", kr: true },
  { lang: "zh", text: "欢迎来到韩国。", kr: true },
  { lang: "vi", text: "Chào mừng đến Hàn Quốc.", kr: false },
];
const placeholders = [
  "K-drama hair like 'The Glory'…",
  "Hongdae nail salon for short stay…",
  "Personal color consulting in English…",
  "글래스 스킨 메이크업 in Hongdae…",
  "Korean layered cut · 송혜교 룩…",
];
const regions = [
  "Seoul",
  "Busan",
  "Jeju",
  "Gangnam",
  "Hongdae",
  "Myeongdong",
  "Seongsu",
  "Apgujeong",
];
const moods = [
  ["🎬", "K-drama 송혜교 룩"],
  ["✨", "Glass-skin makeup"],
  ["💗", "Aegyo sal eyes"],
  ["🌸", "Cherry-blossom pink"],
  ["💋", "Chunky lip liner"],
  ["🎀", "Diffused blush"],
  ["🌟", "Personal color 진단"],
  ["🔥", "Pink-blonde balayage"],
  ["✂️", "K-pop layered cut"],
];
const stores = [
  {
    n: "Stylista — 홍대점",
    area: "Hongdae · 4 min walk",
    rating: "4.92",
    count: 412,
    img: "alt-1",
    verified: true,
  },
  {
    n: "유리 살롱",
    area: "Apgujeong · 2 min walk",
    rating: "4.88",
    count: 287,
    img: "alt-2",
    verified: true,
  },
  {
    n: "Mirror Glass Studio",
    area: "Seongsu · 6 min walk",
    rating: "4.81",
    count: 193,
    img: "alt-3",
    verified: false,
  },
  {
    n: "Nail Atelier 청담",
    area: "Cheongdam · 3 min walk",
    rating: "4.95",
    count: 521,
    img: "alt-4",
    verified: true,
  },
  {
    n: "Color Lab Hongdae",
    area: "Hongdae · 5 min walk",
    rating: "4.79",
    count: 156,
    img: "alt-1",
    verified: true,
  },
  {
    n: "Soohair Myeongdong",
    area: "Myeongdong · 1 min walk",
    rating: "4.86",
    count: 308,
    img: "alt-2",
    verified: false,
  },
];
const trending = [
  "K-drama short layered cut",
  "Glass-skin makeup trial",
  "Pink-blonde balayage",
  "Personal color consultation",
  "Aegyo sal makeup",
  "Korean perm",
];
const reviews = [
  {
    flag: "🇯🇵",
    stars: 5,
    q: "송혜교 같은 단발 가능했어요!",
    t: "Got the same short cut as Song Hye-kyo!",
  },
  {
    flag: "🇨🇳",
    stars: 5,
    q: "膚色对比超惊艳，我变好看了。",
    t: "The color contrast was stunning. I look great.",
  },
  {
    flag: "🇻🇳",
    stars: 5,
    q: "Glass skin lần đầu, mê quá!",
    t: "First time with glass skin makeup — obsessed.",
  },
];

function HeroMotif() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
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

function CamIllust() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
      <rect
        x="10"
        y="22"
        width="56"
        height="38"
        rx="6"
        stroke="#1A2238"
        strokeWidth="1.5"
      />
      <path
        d="M26 22 30 16h16l4 6"
        stroke="#1A2238"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="38" cy="40" r="10" stroke="#1A2238" strokeWidth="1.5" />
      <circle cx="38" cy="40" r="5" stroke="#D88B5B" strokeWidth="1.5" />
      <g stroke="#D88B5B" strokeWidth="1.5">
        <path d="M58 14v6M55 17h6" />
        <path d="M64 30v4M62 32h4" />
      </g>
    </svg>
  );
}

function Landing() {
  const [g, setG] = useState(0);
  const [p, setP] = useState(0);
  const [region, setRegion] = useState("Seoul");
  const [tab, setTab] = useState("Search");
  const [lang, setLang] = useState("EN");
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setG((x) => (x + 1) % greetings.length), 3000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(
      () => setP((x) => (x + 1) % placeholders.length),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="landing-stage">
      <div className="iphone">
        <div className="notch" />
        <div className="statusbar">
          <span>9:41</span>
          <div className="icons">
            <svg width="16" height="10" viewBox="0 0 16 10">
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
            <svg width="16" height="10" viewBox="0 0 16 10">
              <path
                d="M8 3a6 6 0 0 1 4 1.5l1-1A8 8 0 0 0 8 1a8 8 0 0 0-5 2.5l1 1A6 6 0 0 1 8 3"
                fill="currentColor"
              />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            </svg>
            <svg width="22" height="11" viewBox="0 0 22 11">
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

        <div className="scroll">
          {/* Topbar */}
          <div className="topbar">
            <span className="brand">Hesya</span>
            <span className="lang-pill" onClick={() => setShowSheet(true)}>
              <Icon.globe size={14} /> {lang}
            </span>
          </div>

          {/* Hero */}
          <div className="hero-l">
            <div className="ink-motif">
              <HeroMotif />
            </div>
            <div className="greeting-stack">
              {greetings.map((gr, i) => (
                <div
                  key={i}
                  className={
                    "greeting" +
                    (gr.kr ? " kr" : "") +
                    (i === g ? " active" : "")
                  }
                >
                  {gr.text}
                </div>
              ))}
            </div>
            <div
              className="underline"
              style={{ width: g === 0 || g === 4 ? 36 : 28 }}
            />
            <p className="sub">
              Book K-beauty salons in your language — no Korean app, no awkward
              DMs.
            </p>
          </div>

          {/* Search */}
          <div className="search-zone">
            <div className="search-input">
              <span className="lead">
                <Icon.search size={20} />
              </span>
              <span className="ph">{placeholders[p]}</span>
              <span className="mic">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M19 10a7 7 0 0 1-14 0M12 19v3" />
                </svg>
              </span>
            </div>
          </div>

          {/* Mood chips */}
          <div className="mood-cap">Or browse by vibe / 분위기로 둘러보기</div>
          <div className="mood-scroll">
            {moods.map(([ic, t]) => (
              <span key={t} className="mood-chip">
                <span className="ico">{ic}</span>
                {t}
              </span>
            ))}
          </div>
          <div className="live-row">
            <span className="live-dot" />
            <span>Trending now on K-beauty SNS · 지금 인기</span>
          </div>

          {/* Regions */}
          <div className="region-row">
            <div className="label">Choose a city · 도시 선택</div>
            <div className="region-scroll">
              {regions.map((r) => (
                <span
                  key={r}
                  className={"region-chip" + (r === region ? " active" : "")}
                  onClick={() => setRegion(r)}
                >
                  <Icon.pin size={12} /> {r}
                </span>
              ))}
            </div>
          </div>

          {/* AI photo entry */}
          <div className="ai-card">
            <div>
              <h4>Got a photo of the look you want?</h4>
              <div className="sl">
                Our AI checks if your dream style is doable here, in seconds.
              </div>
              <button className="cta">Upload a photo →</button>
            </div>
            <div className="cam-illust">
              <CamIllust />
            </div>
          </div>

          {/* UGC wall */}
          <div className="section-l">
            <div className="head">
              <h3>
                진짜 여행자들이 공유한 모습 / Real travelers, real results
              </h3>
              <span className="sub">
                Instagram & Xiaohongshu에서 가져온 후기
              </span>
            </div>
            <div className="ugc-l">
              {[
                ["🇯🇵", "Sakura", "insta", 5, "송혜교 같은 단발 가능했어!"],
                ["🇨🇳", "Mei", "xhs", 5, "膚色对比超惊艳"],
                ["🇺🇸", "Emma", "insta", 5, "Best layered cut of my life"],
                ["🇹🇼", "Yi-Ling", "insta", 4, "디자이너 영어 가능해서 안심"],
                ["🇻🇳", "Linh", "xhs", 5, "글래스 스킨 처음 받아봤어요"],
                ["🇯🇵", "Aoi", "insta", 5, "パーソナルカラー診断◎"],
              ].map(([f, n, s, st, q], i) => (
                <div className="ugc-card" key={i}>
                  <div className="img">
                    <div className="source">
                      {s === "insta" ? (
                        <span style={{ color: "#C13584" }}>◉</span>
                      ) : (
                        <span
                          style={{
                            color: "#FE2C55",
                            fontSize: 9,
                            fontWeight: 700,
                          }}
                        >
                          红
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="meta">
                    <div className="top">
                      <span>{f}</span>
                      <span style={{ fontSize: 12 }}>{n}</span>
                      <span className="stars">{"★".repeat(st)}</span>
                    </div>
                    <div className="quote">{q}</div>
                  </div>
                </div>
              ))}
              <div className="more-card">
                <Icon.arrowUR size={20} />
                <span>Show more</span>
              </div>
            </div>
          </div>

          {/* Loved by your country */}
          <div className="section-l">
            <div className="head">
              <h3>Loved by 🇯🇵 travelers from your country</h3>
              <span className="sub">
                Curated by the language you booked from
              </span>
            </div>
            <div className="store-row">
              {stores.map((s, i) => (
                <div className="store-card" key={i}>
                  <div className={"img " + s.img} />
                  <div className="pad">
                    <h4>{s.n}</h4>
                    <div className="meta">
                      <Icon.pin size={11} /> {s.area}
                    </div>
                    <div className="row">
                      <span className="stars">★</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--hesya-navy-900)",
                        }}
                      >
                        {s.rating}
                      </span>
                      <span className="count">({s.count})</span>
                      {s.verified && (
                        <span className="badge badge-kverified">
                          ★ K-Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="section-l">
            <div className="head">
              <h3>Foreigners' top requests this week</h3>
              <span className="sub">Filtered search · tap to apply</span>
            </div>
            <div className="trend-chips">
              {trending.map((t, i) => (
                <span key={t} className="trend-chip">
                  <span className="rank">#{i + 1}</span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="section-l">
            <div className="head">
              <h3>Real reviews from real travelers</h3>
              <span className="sub">번역은 자동으로 표시됩니다</span>
            </div>
            <div className="reviews-l">
              {reviews.map((r, i) => (
                <div className="review-card" key={i}>
                  <div className="left">
                    <span className="flag">{r.flag}</span>
                    <span className="stars">{"★".repeat(r.stars)}</span>
                  </div>
                  <div className="body">
                    <div className="quote">{r.q}</div>
                    <div className="trans">→ {r.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety strip */}
          <div className="safety-strip">
            <div className="heading">For solo travelers · 솔로 여행자 안내</div>
            <div className="stats">
              <div className="stat">
                <span className="ico">🇰🇷</span>
                <div>
                  <b>South Korea — Tier 2 Safe Country</b> for female travelers
                </div>
              </div>
              <div className="stat">
                <span className="ico">👥</span>
                <div>
                  <b>92%</b> of Hesya stores have female stylists on staff
                </div>
              </div>
              <div className="stat">
                <span className="ico">📍</span>
                <div>
                  All stores within <b>5 min</b> of major subway stations
                </div>
              </div>
              <div className="stat">
                <span className="ico">💬</span>
                <div>
                  <b>24/7 chat support</b> in your language
                </div>
              </div>
            </div>
            <div className="source">
              Source · CEOWORLD 2026 Solo Female Travel Index
            </div>
          </div>

          <div className="spacer-bottom" />
        </div>

        {/* Tab bar */}
        <div className="tabbar-fixed">
          {[
            ["Search", "search"],
            ["Bookings", "calendar"],
            ["Chat", "message"],
            ["MyPage", "user"],
          ].map(([n, k]) => {
            const Ic = Icon[k];
            return (
              <div
                key={n}
                className={"item" + (n === tab ? " active" : "")}
                onClick={() => setTab(n)}
              >
                <Ic size={20} />
                <span>{n}</span>
              </div>
            );
          })}
        </div>

        {/* Language sheet */}
        {showSheet && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              background: "rgba(26,34,56,0.4)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowSheet(false)}
          >
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                background: "white",
                borderRadius: 24,
                padding: "16px 8px 12px",
                boxShadow: "var(--shadow-3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  background: "var(--gray-300)",
                  borderRadius: 2,
                  margin: "0 auto 12px",
                }}
              />
              <div
                style={{
                  padding: "0 12px 8px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Choose language
              </div>
              {[
                ["한국어", "KR"],
                ["English", "EN"],
                ["日本語", "JP"],
                ["中文(简)", "CN"],
                ["中文(繁)", "TW"],
                ["Tiếng Việt", "VI"],
              ].map(([n, c]) => (
                <div
                  key={c}
                  onClick={() => {
                    setLang(c);
                    setShowSheet(false);
                  }}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    fontSize: 15,
                    color: "var(--hesya-navy-900)",
                    display: "flex",
                    justifyContent: "space-between",
                    background:
                      c === lang ? "var(--hesya-peach-100)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span>{n}</span>
                  {c === lang && (
                    <span style={{ color: "var(--hesya-amber-600)" }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Landing />);
