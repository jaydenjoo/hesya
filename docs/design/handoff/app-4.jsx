/* global React */
const { useState: useState4, useEffect: useEffect4, useRef: useRef4 } = React;
const Icon4 = window.__hesyaIcons;
const SectionHead4 = window.SectionHead;

// --- SECTION 10 — Female lens ------------------------------------------
const trustColors = [
  {
    v: "--trust-rose",
    hex: "#E8C4D6",
    name: "Safety Rose",
    use: "Female-Friendly badges, women-only hour indicators, review empathy. NEVER buttons or large blocks.",
    textDark: false,
  },
  {
    v: "--share-glow",
    hex: "#F8D7C8",
    name: "Share Glow",
    use: "1-px border on shareable cards. Visual signal: this card is screenshot-ready.",
    textDark: false,
  },
  {
    v: "--kverified-gold",
    hex: "#D4AF37",
    name: "K-Verified Gold",
    use: "Dual K-Verified + Female-Friendly. Restraint required.",
    textDark: false,
  },
];

function UGCCard({ flag, source, stars, quote, lang }) {
  const isInsta = source === "insta";
  return (
    <div className="ugc-card">
      <div className="img">
        <div className="source" title={isInsta ? "Instagram" : "Xiaohongshu"}>
          {isInsta ? (
            <span style={{ color: "#C13584" }}>◉</span>
          ) : (
            <span style={{ color: "#FE2C55" }}>红</span>
          )}
        </div>
      </div>
      <div className="meta">
        <div className="top">
          <span>{flag}</span>
          <span>{lang}</span>
          <span className="stars">{"★".repeat(stars)}</span>
        </div>
        <div className="quote">{quote}</div>
      </div>
    </div>
  );
}

function BeforeAfter() {
  const [pos, setPos] = useState4(50);
  const ref = useRef4();
  const drag = useRef4(false);

  useEffect4(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const elapsed = t - start;
      if (elapsed > 1400) {
        setPos(50);
        return;
      }
      // sweep to ~80% then back to 50
      const half = 700;
      let p;
      if (elapsed < half) {
        p = 50 + 30 * (elapsed / half);
      } else {
        p = 80 - 30 * ((elapsed - half) / half);
      }
      setPos(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const p = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    setPos(p);
  };

  return (
    <div>
      <div
        className="beforeafter"
        ref={ref}
        onMouseDown={(e) => {
          drag.current = true;
          onMove(e.clientX);
        }}
        onMouseMove={(e) => {
          if (drag.current) onMove(e.clientX);
        }}
        onMouseUp={() => (drag.current = false)}
        onMouseLeave={() => (drag.current = false)}
        onTouchStart={(e) => {
          drag.current = true;
          onMove(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          if (drag.current) onMove(e.touches[0].clientX);
        }}
        onTouchEnd={() => (drag.current = false)}
      >
        <div className="layer before">
          <span>before</span>
        </div>
        <div
          className="layer after"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <span>after</span>
        </div>
        <span className="corner-pill before">Before</span>
        <span className="corner-pill after">After</span>
        <div className="ba-handle" style={{ left: `${pos}%` }}>
          <div className="ba-knob">↔</div>
        </div>
      </div>
      <div className="beforeafter-hint">Drag to compare · 좌우로 드래그</div>
    </div>
  );
}

function Section10() {
  return (
    <section className="ds-section" id="s10">
      <div className="page">
        <SectionHead4
          num="10"
          eyebrow="Female lens · v2.0"
          title={
            <>
              Trust, <em>read by behavior</em>.
            </>
          }
          desc="The female lens lives in safety signals, shareability, and visual verification — not in pink ribbons. The rose and share-glow tokens are intentionally subdued."
        />

        {/* 10.1 trust colors */}
        <div className="sub-label">10.1 — Trust & Safety colors</div>
        <div className="trust-row">
          <div className="swatch-grid">
            {trustColors.map((c, i) => (
              <div className="swatch" key={i}>
                <div className="swatch-chip" style={{ background: c.hex }}>
                  <span className="hex">{c.hex}</span>
                </div>
                <div className="swatch-meta">
                  <div className="name">{c.name}</div>
                  <div className="var">{c.v}</div>
                  <div className="use">{c.use}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10.2 — already in BadgeBlock; show summary row */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.2 — New badge variants
        </div>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <span className="badge badge-female">
            <span className="ico">♀</span> Female stylists available
          </span>
          <span className="badge badge-female kr">
            <span className="ico">♀</span> 여성 디자이너 응대 가능
          </span>
          <span className="badge badge-female">♀ 女性スタイリスト対応</span>
          <span className="badge badge-safe-hours kr">
            ☀ 10:00–18:00 · 안전 시간대
          </span>
          <span className="badge badge-verified-women">
            <span style={{ color: "var(--semantic-success)" }}>✓</span> Verified
            by{" "}
            <span className="mono" style={{ fontWeight: 600 }}>
              247
            </span>{" "}
            women travelers
          </span>
        </div>

        {/* 10.3 UGC */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.3 — UGC Photo Wall
        </div>
        <p
          style={{ color: "var(--gray-700)", maxWidth: "60ch" }}
          className="body-sm"
        >
          A horizontally scrollable carousel of real customer photos pulled from
          Instagram and Xiaohongshu. 4:5 aspect, photo fills 75%, language flag
          + first-name initial + 5★ + 1-line quote in the bottom 25%.
        </p>
        <div className="ugc-row">
          <UGCCard
            flag="🇯🇵"
            lang="Sakura"
            source="insta"
            stars={5}
            quote="송혜교 같은 단발 가능했어!"
          />
          <UGCCard
            flag="🇨🇳"
            lang="Mei"
            source="xhs"
            stars={5}
            quote="膚色对比超惊艳"
          />
          <UGCCard
            flag="🇺🇸"
            lang="Emma"
            source="insta"
            stars={5}
            quote="Best layered cut of my life"
          />
          <UGCCard
            flag="🇹🇼"
            lang="Yi-Ling"
            source="insta"
            stars={4}
            quote="디자이너 영어 가능해서 안심"
          />
          <UGCCard
            flag="🇻🇳"
            lang="Linh"
            source="xhs"
            stars={5}
            quote="글래스 스킨 처음 받아봤어요"
          />
        </div>
        <p
          className="caption"
          style={{
            color: "var(--gray-500)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: 11,
          }}
        >
          공유된 진짜 후기 / Real shared reviews
        </p>

        {/* 10.4 Before/After */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.4 — Before / After Slider
        </div>
        <div className="beforeafter-row">
          <BeforeAfter />
          <div style={{ paddingTop: 8 }}>
            <p
              style={{ color: "var(--gray-700)", maxWidth: "56ch" }}
              className="body-sm"
            >
              Container 320×400, --r-2xl, --shadow-2. Vertical drag handle in
              peach-200 with a 24×24 amber-500 knob. Edge pills outline (Before)
              and fill (After) at the top corners.
            </p>
            <p
              style={{
                color: "var(--gray-700)",
                maxWidth: "56ch",
                marginTop: 12,
              }}
              className="body-sm"
            >
              On first view: handle sweeps 30% → back over 1.4s. Skipped on{" "}
              <code>prefers-reduced-motion</code>. Drag follows touch within
              16ms; no easing on the handle itself.
            </p>
          </div>
        </div>

        {/* 10.5 Mood chips */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.5 — Mood Search Chips
        </div>
        <div className="mood-row">
          <span className="mood-chip">
            <span className="ico">🎬</span>K-드라마 송혜교 룩
          </span>
          <span className="mood-chip">
            <span className="ico">✨</span>글래스 스킨 메이크업
          </span>
          <span className="mood-chip">
            <span className="ico">💗</span>Aegyo Sal 메이크업
          </span>
          <span className="mood-chip">
            <span className="ico">🌸</span>벚꽃 핑크 발레리나
          </span>
          <span className="mood-chip">
            <span className="ico">💋</span>Chunky lip liner
          </span>
          <span className="mood-chip">
            <span className="ico">🎀</span>Diffused blush
          </span>
          <span className="mood-chip">
            <span className="ico">🌟</span>Personal Color 진단
          </span>
          <span className="mood-chip">
            <span className="ico">🔥</span>Pink-blonde balayage
          </span>
          <span className="mood-chip">
            <span className="ico">✂️</span>K-pop layered cut
          </span>
        </div>
        <p
          className="caption"
          style={{
            color: "var(--gray-500)",
            textTransform: "none",
            fontSize: 12,
            marginTop: 12,
          }}
        >
          Trending now on K-beauty SNS / 지금 K-뷰티 SNS 인기 검색어
        </p>

        {/* 10.6 Share card */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.6 — Share Card · 9:16 SNS-optimized
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "270px 1fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div>
            <div className="share-card">
              <div className="top">
                <svg className="motif-bg" viewBox="0 0 120 120">
                  <g
                    stroke="#1A2238"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  >
                    <path d="M20 30h30M35 18v22M35 75a18 18 0 1 0 0-36" />
                    <path d="M70 25l-6 60M105 22l-6 60M64 50h35" />
                  </g>
                </svg>
              </div>
              <div className="mid">
                <div className="wm">Hesya</div>
                <div className="nm">Sakura 🇯🇵</div>
                <div className="row">
                  <span className="lbl">Service ·</span>
                  <span>Korean Layered Cut</span>
                </div>
                <div className="row">
                  <span className="lbl">Salon ·</span>
                  <span>Stylista — Hongdae</span>
                </div>
                <div className="row">
                  <span className="lbl">Date ·</span>
                  <span className="mono">2026.04.15</span>
                </div>
              </div>
              <div className="bot">
                <div className="qr"></div>
                <div className="tag">
                  <b>Booked through Hesya</b>
                  <br />
                  The Korean welcome,
                  <br />
                  in 5 languages.
                </div>
              </div>
            </div>
            <div className="share-actions">
              <span className="act">
                <Icon4.upload size={12} /> Save
              </span>
              <span className="act">
                <Icon4.camera size={12} /> Story
              </span>
              <span className="act">
                <Icon4.link size={12} /> Copy link
              </span>
            </div>
          </div>
          <div style={{ paddingTop: 8 }}>
            <p
              style={{ color: "var(--gray-700)", maxWidth: "60ch" }}
              className="body-sm"
            >
              1080×1920 logical · --r-2xl · --shadow-3 · 1px{" "}
              <code>--share-glow</code> border. The ㅎ→H ink motif sits in the
              top-right at 8% opacity. Auto-generated for booking confirmation,
              AI photo analysis result, and past visit recap.
            </p>
            <p
              style={{
                color: "var(--gray-700)",
                maxWidth: "60ch",
                marginTop: 12,
              }}
              className="body-sm"
            >
              The 1px share-glow border is the visual signal:{" "}
              <i>this card is screenshot-ready</i>. Used nowhere else in the
              system.
            </p>
          </div>
        </div>

        {/* 10.7 Safety profile */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.7 — Salon Safety Profile
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div className="safety-card">
            <h5>이 매장의 안전 정보 / Safety</h5>
            <div className="row">
              <span className="ico">👥</span>
              <span className="lbl">여성 디자이너 비율</span>
              <span className="val mono">
                75%
                <br />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 400,
                    color: "var(--gray-500)",
                  }}
                >
                  (8명 중 6명)
                </span>
              </span>
            </div>
            <div className="row">
              <span className="ico">🌅</span>
              <span className="lbl">안전 시간대</span>
              <span className="val mono">10:00–20:00</span>
            </div>
            <div className="row">
              <span className="ico">🚇</span>
              <span className="lbl">가장 가까운 역</span>
              <span
                className="val kr"
                style={{ fontSize: 11, lineHeight: 1.4 }}
              >
                홍대입구역 1번 출구
                <br />
                도보 4분
              </span>
            </div>
            <div className="row">
              <span className="ico">🚨</span>
              <span className="lbl">비상시 한국어 SOS</span>
              <span
                className="val mono"
                style={{ fontSize: 11, lineHeight: 1.4 }}
              >
                112
                <br />
                070-xxxx
              </span>
            </div>
            <div className="footer">
              여성 솔로 여행자 <span className="count mono">247명</span>이
              방문했어요.
            </div>
          </div>
          <div style={{ paddingTop: 8 }}>
            <p
              style={{ color: "var(--gray-700)", maxWidth: "60ch" }}
              className="body-sm"
            >
              Shown only on stores that have completed the optional
              Female-Friendly verification.{" "}
              <b style={{ color: "var(--semantic-danger)" }}>
                Never fabricate this badge
              </b>{" "}
              — if any field is unverified, the entire card is hidden, not
              partial.
            </p>
            <p
              style={{
                color: "var(--gray-700)",
                maxWidth: "60ch",
                marginTop: 12,
              }}
              className="body-sm"
            >
              The visit count animates from 0 to its final value over 1.4s when
              the card enters the viewport. Skipped on{" "}
              <code>prefers-reduced-motion</code>.
            </p>
          </div>
        </div>

        {/* 10.8 Tone verification pill */}
        <div className="sub-label" style={{ marginTop: 64 }}>
          10.8 — Tone Verification Pill (Store Inbox)
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          <div className="ai-reply-card">
            <div className="ai-head">
              <Icon4.sparkles size={14} color="var(--hesya-amber-600)" />
              <span>AI auto-reply proposal</span>
              <span className="tone-pill warm" style={{ marginLeft: "auto" }}>
                ✓ 따뜻한 톤
              </span>
            </div>
            <div className="draft">
              안녕하세요 Sakura님 :)
              <br />
              5월 4일 14시 예약 가능합니다. 글래스 스킨 메이크업으로 준비해
              둘게요. 편하게 오세요!
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm">Edit</button>
              <button className="btn btn-primary btn-sm">Send reply</button>
            </div>
          </div>
          <div className="ai-reply-card">
            <div className="ai-head">
              <Icon4.sparkles size={14} color="var(--hesya-amber-600)" />
              <span>AI auto-reply proposal</span>
              <span className="tone-pill cool" style={{ marginLeft: "auto" }}>
                ⚠ 약간 차가운 느낌
              </span>
            </div>
            <div className="draft">
              5월 4일 14시 예약 확정. 사전 결제 필수. 늦으실 경우 취소됩니다.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm">Soften tone</button>
              <button className="btn btn-secondary btn-sm">Edit</button>
              <button className="btn btn-ghost btn-sm">Send anyway</button>
            </div>
          </div>
        </div>
        <p
          style={{
            color: "var(--gray-500)",
            fontSize: 13,
            marginTop: 16,
            maxWidth: "70ch",
          }}
          className="kr"
        >
          톤 검증 핀은 AI 초안이 매장의 따뜻한 응대 보이스를 유지하는지 사장님께
          신호를 줍니다. 사무적이거나 차가운 느낌이면 부드럽게 다듬는 옵션이
          함께 제안됩니다.
        </p>

        {/* Section 10 closing note */}
        <div
          style={{
            marginTop: 64,
            padding: "20px 24px",
            background: "white",
            border: "1px solid var(--hesya-peach-100)",
            borderRadius: "var(--r-md)",
            color: "var(--gray-700)",
          }}
          className="body-sm"
        >
          <b style={{ color: "var(--hesya-navy-900)" }}>Note —</b> The female
          lens is <i>evident in behavior patterns</i>: UGC, safety signals,
          shareability, visual verification. The Hesya UI never uses the words{" "}
          <i>"for women", "girly", "pretty", "sweet", "cute"</i>. The rose and
          share-glow tokens are subdued by design — they signal warmth and
          trust, not gendered marketing.
        </div>
      </div>
    </section>
  );
}

window.Section10 = Section10;
