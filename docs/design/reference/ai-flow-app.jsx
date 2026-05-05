/* global React */
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;
const IconA = window.__hesyaIcons;

function CamSparkles({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect
        x="10"
        y="22"
        width="60"
        height="42"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M28 22 32 14h16l4 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="44" r="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="44" r="5" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M62 14v6M59 17h6" />
        <path d="M68 32v4M66 34h4" />
        <path d="M14 14v4M12 16h4" />
      </g>
    </svg>
  );
}

function State1Upload() {
  return (
    <div className="iphone-ai">
      <div className="notch" />
      <div className="bar-top">
        <div className="back">
          <IconA.chevR size={18} style={{ transform: "rotate(180deg)" }} />
        </div>
        <div className="ttl">Show us the look.</div>
      </div>
      <div className="scroll-ai">
        <div className="dropzone">
          <CamSparkles size={88} />
          <div className="hint">
            Drop a photo, paste a link, or tap to choose.
          </div>
        </div>
        <div className="upload-actions">
          <span className="up-pill">📸 Take photo</span>
          <span className="up-pill">🖼️ Choose from library</span>
          <span className="up-pill">🔗 Paste image URL</span>
        </div>
        <div className="privacy">
          Works with K-drama screenshots, magazine clippings, or your own
          selfies. Your photo stays private — we delete it after analysis.
        </div>
      </div>
    </div>
  );
}

function State2Analyzing() {
  return (
    <div className="iphone-ai">
      <div className="notch" />
      <div className="photo-top">
        <div className="person">your photo</div>
      </div>
      <div className="bar-top" style={{ position: "absolute" }}>
        <div className="back" style={{ background: "rgba(255,255,255,0.92)" }}>
          <IconA.chevR size={18} style={{ transform: "rotate(180deg)" }} />
        </div>
      </div>
      <div className="progress-card">
        <div className="steps-row">
          <span className="step-pill done">
            <span className="check">✓</span>Reading
          </span>
          <span className="step-pill active">Matching styles…</span>
          <span className="step-pill">Salon capability</span>
          <span className="step-pill">Done</span>
        </div>
        <div className="encourage">"Looking at every strand. One sec…"</div>
        <div className="poweredby">
          <span className="vision-dot" />
          Powered by Hesya's vision model
        </div>
      </div>
    </div>
  );
}

function State3Result() {
  const [auditOpen, setAuditOpen] = useStateA(false);
  const [baPos, setBaPos] = useStateA(50);
  const animRef = useRefA(null);

  useEffectA(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // auto demo: 50 → 0 → 60 → 30 over 1.6s
    const keys = [
      [0, 50],
      [200, 5],
      [800, 60],
      [1400, 30],
      [1600, 50],
    ];
    const start = Date.now();
    const id = setInterval(() => {
      const t = Date.now() - start;
      if (t > 1700) {
        clearInterval(id);
        return;
      }
      // find current key segment
      for (let i = 0; i < keys.length - 1; i++) {
        const [t0, v0] = keys[i],
          [t1, v1] = keys[i + 1];
        if (t >= t0 && t <= t1) {
          const pct = (t - t0) / (t1 - t0);
          setBaPos(v0 + (v1 - v0) * pct);
          return;
        }
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  const onDrag = (e) => {
    e.preventDefault();
    const rect = animRef.current.getBoundingClientRect();
    const move = (cX) => {
      const x = Math.max(0, Math.min(1, (cX - rect.left) / rect.width));
      setBaPos(x * 100);
    };
    const onMove = (ev) =>
      move(ev.touches ? ev.touches[0].clientX : ev.clientX);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    onMove(e);
  };

  return (
    <div className="iphone-ai">
      <div className="notch" />
      <div className="photo-bg" />
      <div className="bar-top">
        <div className="back">
          <IconA.chevR size={18} style={{ transform: "rotate(180deg)" }} />
        </div>
      </div>
      <div className="result-sheet">
        <div className="grab" />
        <h2 className="result-h1">
          <span className="accent">Yes — three salons</span> can do this.
        </h2>

        {/* Bento */}
        <div className="bento-grid">
          <div className="bento-tile">
            <div className="lbl">Style recognized</div>
            <div className="val">
              Korean layered bob with face-framing curtain bangs
            </div>
          </div>
          <div className="bento-tile">
            <div className="lbl">Difficulty</div>
            <div className="dot-meter">
              <span className="d on" />
              <span className="d on" />
              <span className="d" />
              <span>Medium</span>
            </div>
          </div>
          <div className="bento-tile">
            <div className="lbl">Estimated time</div>
            <div
              className="val"
              style={{ fontFamily: "var(--font-mono)", fontSize: 18 }}
            >
              2.5 hrs
            </div>
          </div>
          <div className="bento-tile">
            <div className="lbl">Hair compatibility</div>
            <div className="val">Works on fine straight hair</div>
          </div>
        </div>

        {/* Before/after */}
        <h3 className="section-h">
          What it could look like / 어떤 모습이 될까요?
        </h3>
        <div
          className="ba-slider"
          ref={animRef}
          style={{ "--ba-pos": baPos + "%" }}
          onMouseDown={onDrag}
          onTouchStart={onDrag}
        >
          <div className="img-before" />
          <div className="img-after" />
          <span className="lbl-b">Before</span>
          <span className="lbl-a">After · AI</span>
          <div className="ba-handle" />
        </div>

        <div className="ba-disclaim">
          <b>이 시뮬레이션은 AI 추정이며 실제와 다를 수 있어요.</b>
          <br />
          This simulation is an AI estimate. The actual result depends on your
          hair texture, length, and the stylist's interpretation. We always
          recommend confirming with the stylist via chat before booking.
        </div>

        <div className="ba-cta-row">
          <button className="pri">💬 Ask the stylist about this look</button>
          <div className="row2">
            <button className="gh">🔄 Try a different style</button>
            <button className="gh">📤 Save this look</button>
          </div>
        </div>

        {/* Stylists */}
        <h3 className="section-h" style={{ fontSize: 18 }}>
          Recommended stylists
        </h3>
        <div className="rec-row">
          {[
            {
              n: "이수진 Su-jin",
              s: "Stylista — 홍대",
              m: "94%",
              p: "₩85k",
              po: "",
            },
            {
              n: "박민지 Min-ji",
              s: "유리 살롱 — 청담",
              m: "91%",
              p: "₩95k",
              po: "p2",
            },
            {
              n: "정하늘 Ha-neul",
              s: "Mirror Glass",
              m: "88%",
              p: "₩78k",
              po: "p3",
            },
          ].map((r, i) => (
            <div className="rec-card" key={i}>
              <div className="top-rc">
                <div className={`por ${r.po}`} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="nm">{r.n}</div>
                  <div className="sa">{r.s}</div>
                </div>
              </div>
              <span className="match">★ {r.m} match</span>
              <div className="price-line">{r.p} · 2.5 hrs</div>
              <button className="book-mini">Book →</button>
            </div>
          ))}
        </div>

        {/* Audit */}
        <div className={"audit" + (auditOpen ? " open" : "")}>
          <div className="audit-head" onClick={() => setAuditOpen(!auditOpen)}>
            <div className="ico">
              <IconA.check size={14} />
            </div>
            <div className="lbl">Why these recommendations?</div>
            <div className="arr">
              <IconA.chevR size={14} />
            </div>
          </div>
          <div className="audit-body">
            <ul>
              <li>
                <b>Strand thickness analyzed:</b> medium-fine
              </li>
              <li>
                <b>Cut technique required:</b> point-cut + slide
              </li>
              <li>
                <b>Stylists shown</b> have 5+ similar past works in their
                portfolio
              </li>
              <li>
                <b>Hair-tone simulation:</b> 94% confidence (based on 1,247
                prior cases with similar fine-strand color profiles)
              </li>
            </ul>
          </div>
        </div>

        {/* Save card */}
        <div className="save-card-section">
          <h4>Save the look · 룩 저장하기</h4>
          <div className="sub">
            Share-ready 9:16 card for Instagram Story or Xiaohongshu
          </div>
          <div className="share-preview-row">
            <div className="share-card">
              <div className="sc-photo" />
              <div className="sc-brand">Hesya</div>
              <div className="sc-title">
                Sakura's K-beauty pick
                <br />
                사쿠라의 K-뷰티 픽
              </div>
              <div className="sc-meta">
                <div>K-drama layered bob</div>
                <div>
                  <b>Stylista — 홍대</b>
                </div>
                <div>Discovered Mar 14</div>
              </div>
              <div className="sc-bottom">
                <div className="sc-qr" />
                <div className="sc-tag">
                  The Korean welcome,
                  <br />
                  in 5 languages
                </div>
              </div>
            </div>
            <div className="share-actions">
              <div className="share-act primary">
                <span className="ico">📷</span>Save to Story
              </div>
              <div className="share-act">
                <span className="ico">📤</span>Save to Photos
              </div>
              <div className="share-act">
                <span className="ico">🔗</span>Copy share link
              </div>
            </div>
          </div>
        </div>

        <div className="secondary-actions">
          <span className="sec-link">Save to favorites</span>
          <span className="sec-link divider">·</span>
          <span className="sec-link">Share with friends</span>
          <span className="sec-link divider">·</span>
          <span className="sec-link">Try another photo</span>
        </div>
      </div>
    </div>
  );
}

function AIFlow() {
  return (
    <div className="ai-stage">
      <div className="frame-label">
        <span className="num">STATE 1</span>
        <span className="lab">Upload</span>
        <span className="desc">Tactile dropzone, 3 entry methods</span>
      </div>
      <State1Upload />

      <div className="frame-label">
        <span className="num">STATE 2</span>
        <span className="lab">Analyzing · 3s</span>
        <span className="desc">Pulsing border + step pills</span>
      </div>
      <State2Analyzing />

      <div className="frame-label">
        <span className="num">STATE 3</span>
        <span className="lab">Result</span>
        <span className="desc">
          Sheet 80vh · Bento → B/A → Stylists → Audit → Share
        </span>
      </div>
      <State3Result />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AIFlow />);
