/* global React */
const { useState: useStateL } = React;
const IconL = window.__hesyaIcons;

function Login() {
  const [emailMode, setEmailMode] = useStateL(false);
  const [email, setEmail] = useStateL("");
  const [lang, setLang] = useStateL("EN");
  const [langOpen, setLangOpen] = useStateL(false);

  const langs = [
    { code: "EN", label: "English" },
    { code: "JA", label: "日本語" },
    { code: "ZH", label: "中文" },
    { code: "VI", label: "Tiếng Việt" },
    { code: "KO", label: "한국어" },
  ];

  return (
    <div className="login-stage">
      <div className="iphone-login">
        <div className="notch" />
        <div className="login-body">
          {/* Lang switcher */}
          <div className="lang-switcher">
            <div className="lang-btn" onClick={() => setLangOpen(!langOpen)}>
              <span>🌐</span>
              <span className="lang-code">{lang}</span>
              <span className="lang-chev">▾</span>
            </div>
            {langOpen && (
              <div className="lang-menu">
                {langs.map((l) => (
                  <div
                    key={l.code}
                    className={"lang-item" + (l.code === lang ? " active" : "")}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    <span className="lc">{l.code}</span>
                    <span className="ll">{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top wordmark */}
          <div className="login-top">
            <svg
              className="ink-motif"
              viewBox="0 0 200 120"
              fill="none"
              aria-hidden="true"
            >
              <g
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              >
                <path d="M40 30 Q60 20 80 30 Q90 50 70 60 Q50 65 50 80 Q60 95 90 90" />
                <text
                  x="105"
                  y="80"
                  fontSize="60"
                  fontFamily="Fraunces"
                  fontStyle="italic"
                  stroke="none"
                  fill="currentColor"
                >
                  H
                </text>
                <path d="M85 50 L100 55" strokeDasharray="2 4" />
              </g>
            </svg>
            <h1 className="login-wordmark">Hesya</h1>
            <p className="login-sub">
              The Korean welcome, <em>in 5 languages.</em>
            </p>
          </div>

          {/* Auth stack */}
          {!emailMode ? (
            <div className="auth-stack">
              <button className="oauth-btn google">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41.7 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button className="oauth-btn apple">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#FFFFFF"
                  aria-hidden="true"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span>Continue with Apple</span>
              </button>

              <button className="email-link" onClick={() => setEmailMode(true)}>
                Use email instead
              </button>

              <div className="login-divider">
                <span className="line" />
                <span className="or">or</span>
                <span className="line" />
              </div>

              <button className="passkey-link">
                <span className="key-emo">🔑</span>
                <span>Use a passkey</span>
                <span className="returning">
                  — faster for returning travelers
                </span>
              </button>
            </div>
          ) : (
            <div className="auth-stack email-form">
              <div className="email-field">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="email-input">Email address</label>
              </div>
              <button
                className={
                  "primary-cta" + (email.includes("@") ? "" : " disabled")
                }
                disabled={!email.includes("@")}
              >
                Continue
              </button>
              <p className="email-hint">
                We'll email you a 6-digit code — no password needed.
              </p>
              <button className="back-link" onClick={() => setEmailMode(false)}>
                ← Back to social sign-in
              </button>
            </div>
          )}

          {/* Compliance */}
          <p className="compliance">
            By continuing, you agree to Hesya's <a>Terms</a> and{" "}
            <a>Privacy Policy</a>.
            <br />
            <span className="comply-line">
              <span className="badge">GDPR</span>
              <span className="badge">K-PIPA</span>
              <span className="comply-text">We never sell your data.</span>
            </span>
          </p>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <a>Help</a>
          <span className="dot">·</span>
          <a>Terms</a>
          <span className="dot">·</span>
          <a>Privacy</a>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Login />);
