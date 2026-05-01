/* global React */
const { useState: useS, useEffect: useE, useRef: useR } = React;

const TICKER = [
  {
    num: "01",
    title: "5채널 통합 인박스",
    meta: "KakaoTalk · Instagram · WhatsApp · LINE · Facebook",
  },
  {
    num: "02",
    title: "AI 자동 응답 — 5개 언어 즉시 답장",
    meta: "한국어 · 日本語 · 中文 · English · Tiếng Việt",
  },
  {
    num: "03",
    title: "결제 통합 — 한 번에 정산",
    meta: "Stripe · Alipay+ · WeChat · LINE Pay · PayPay",
  },
  {
    num: "04",
    title: "K-Verified 매장 인증으로 신뢰 ↑",
    meta: "정부 등록 · 위생 점검 · 외국인 응대 검증",
  },
];

function BrandPanel() {
  const [idx, setIdx] = useS(0);
  const [exiting, setExiting] = useS(false);
  const timerRef = useR(null);

  useE(() => {
    timerRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % TICKER.length);
        setExiting(false);
      }, 180);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => {
    if (i === idx) return;
    clearInterval(timerRef.current);
    setExiting(true);
    setTimeout(() => {
      setIdx(i);
      setExiting(false);
    }, 180);
    timerRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIdx((j) => (j + 1) % TICKER.length);
        setExiting(false);
      }, 180);
    }, 4000);
  };

  const stores = [
    { mark: "혜미", loc: "Seoul · 강남" },
    { mark: "Lumière", loc: "Seoul · 청담", italic: true },
    { mark: "스튜디오 정", loc: "Busan · 해운대" },
    { mark: "STYLISTA", loc: "Seoul · 홍대", sans: true },
  ];

  return (
    <aside className="sl-brand">
      <div className="sl-brand-top">
        <div className="sl-brand-mark-row">
          <span className="sl-brand-mark">Hesya</span>
          <span className="sl-brand-tag">Store</span>
        </div>
        <button className="sl-brand-back kr">← 손님 페이지로</button>
      </div>

      <div className="sl-brand-center">
        <div className="sl-eyebrow">
          <span className="sl-eyebrow-dot" />
          <span className="kr">매장 매니저 콘솔</span>
        </div>
        <div className="sl-hero-mark">
          Run your salon<span className="sl-period">.</span>
        </div>
        <div className="sl-hero-sub kr">
          외국인 손님을 위한 매장 운영의 모든 것
        </div>
        <div className="sl-hero-sub-en">
          One desk · five channels · five languages.
        </div>

        <div className="sl-ticker" aria-live="polite">
          <div className="sl-ticker-label">
            <span>Why Hesya</span>
            <span>{String(idx + 1).padStart(2, "0")} / 04</span>
          </div>
          <div className="sl-ticker-track">
            {TICKER.map((t, i) => (
              <div
                key={i}
                className={
                  "sl-ticker-item" +
                  (i === idx ? (exiting ? " exit" : " active") : "")
                }
              >
                <div className="sl-ticker-num">{t.num}</div>
                <div className="sl-ticker-body">
                  <div className="sl-ticker-title kr-display">{t.title}</div>
                  <div className="sl-ticker-meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sl-ticker-dots">
            {TICKER.map((_, i) => (
              <button
                key={i}
                className={"sl-ticker-dot" + (i === idx ? " active" : "")}
                onClick={() => goTo(i)}
                aria-label={"Slide " + (i + 1)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sl-brand-foot">
        <div className="sl-foot-caption kr">함께하는 매장들</div>
        <div className="sl-foot-logos">
          {stores.map((s, i) => (
            <div key={i} className="sl-store-logo">
              <span
                className={
                  "sl-store-logo-mark" +
                  (s.sans ? " sans" : "") +
                  (s.italic ? "" : " kr")
                }
              >
                {s.mark}
              </span>
              <span className="sl-store-logo-loc">{s.loc}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function FormPanel() {
  const [email, setEmail] = useS("");
  const [pw, setPw] = useS("");
  const [reveal, setReveal] = useS(false);
  const [remember, setRemember] = useS(true);

  return (
    <main className="sl-form">
      <div className="sl-form-top">
        <button className="sl-lang-chip">
          <span>🌐</span>
          <span>한국어</span>
          <span style={{ opacity: 0.4 }}>▾</span>
        </button>
      </div>

      <div className="sl-form-stack">
        <div className="sl-h-eyebrow">
          <span>Sign in</span>
          <span className="sl-h-eyebrow-line" />
        </div>
        <h1 className="sl-h-title kr-display">
          매장 <em>로그인</em>
        </h1>
        <p className="sl-h-body kr">
          매장 매니저 계정으로 로그인하세요. 처음이라면 사업자등록번호로 가입을
          시작할 수 있습니다.
        </p>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="sl-field">
            <input
              type="email"
              id="sl-email"
              className="sl-field-input"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="sl-email" className="sl-field-label kr">
              이메일
            </label>
          </div>

          <div className="sl-field">
            <input
              type={reveal ? "text" : "password"}
              id="sl-pw"
              className="sl-field-input"
              placeholder=" "
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{ paddingRight: "60px" }}
            />
            <label htmlFor="sl-pw" className="sl-field-label kr">
              비밀번호
            </label>
            <button
              type="button"
              className="sl-field-reveal kr"
              onClick={() => setReveal(!reveal)}
            >
              {reveal ? "숨기기" : "보기"}
            </button>
          </div>

          <div className="sl-row">
            <label className="sl-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              <span className="sl-checkbox-box" />
              <span className="kr">자동 로그인</span>
            </label>
            <button type="button" className="sl-link kr">
              비밀번호 찾기 →
            </button>
          </div>

          <button type="submit" className="sl-btn-primary kr">
            로그인
            <span className="sl-btn-primary-arrow">→</span>
          </button>
        </form>

        <div className="sl-divider">
          <span className="sl-divider-line" />
          <span className="sl-divider-or">또는</span>
          <span className="sl-divider-line" />
        </div>

        <button className="sl-btn-google kr">
          <svg className="sl-btn-google-icon" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.32z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          <span>Google로 로그인</span>
        </button>

        <div className="sl-thin-divider" />

        <a href="#" className="sl-signup">
          <div className="sl-signup-body">
            <span className="sl-signup-eyebrow">New here</span>
            <span className="sl-signup-text kr">
              처음이신가요? 무료 매장 가입
            </span>
          </div>
          <span className="sl-signup-arrow">→</span>
        </a>
      </div>

      <div className="sl-trust">
        <div className="sl-trust-row">
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🔒</span>
            <span className="kr">256-bit SSL</span>
          </div>
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🇰🇷</span>
            <span className="kr">한국 내 서버</span>
          </div>
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🛡</span>
            <span className="kr">개인정보 보호 인증</span>
          </div>
        </div>
        <div className="sl-trust-meta">
          <span className="kr">도움이 필요하신가요?</span>
          <button className="sl-trust-help kr">매장 지원팀 →</button>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <div className="sl-app" data-screen-label="Store Login">
      <BrandPanel />
      <FormPanel />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
