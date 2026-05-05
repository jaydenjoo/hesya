/* global React */
const { useState: useState3, useEffect: useEffect3, useRef: useRef3 } = React;
const Icon3 = window.__hesyaIcons;
const SectionHead3 = window.SectionHead;

// --- SECTION 6 — ICONOGRAPHY --------------------------------------------
function Section6() {
  const iconList = [
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
  ];
  const labels = {
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
  return (
    <section className="ds-section" id="s6">
      <div className="page">
        <SectionHead3
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
          {iconList.map((k) => {
            const Ic = Icon3[k];
            return (
              <div className="icon-cell" key={k}>
                <Ic size={24} sw={1.5} />
                <span className="name">{labels[k]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- SECTION 7 — IMAGERY -------------------------------------------------
function Section7() {
  return (
    <section className="ds-section" id="s7">
      <div className="page">
        <SectionHead3
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
          mascots · "✨AI Powered✨" badges anywhere.
        </div>
      </div>
    </section>
  );
}

// --- SECTION 8 — GRID ---------------------------------------------------
function Section8() {
  return (
    <section className="ds-section" id="s8">
      <div className="page">
        <SectionHead3
          num="08"
          eyebrow="Layout & Breakpoints"
          title={
            <>
              A grid that <em>holds the room</em>.
            </>
          }
          desc="12-col on desktop, 4-col on mobile. Bento layout reserved for dashboards only."
        />

        <div className="sub-label">Breakpoints</div>
        <div className="bp-grid">
          {[
            ["--bp-sm", "640", "large phone"],
            ["--bp-md", "768", "tablet · in-salon translator"],
            ["--bp-lg", "1024", "small laptop"],
            ["--bp-xl", "1280", "store dashboard"],
            ["--bp-2xl", "1536", "admin dashboards"],
          ].map(([n, p, l]) => (
            <div className="bp-cell" key={n}>
              <div className="nm">{n}</div>
              <div className="px mono">
                {p}
                <span style={{ fontSize: 13, color: "var(--gray-500)" }}>
                  px
                </span>
              </div>
              <div className="lbl">{l}</div>
            </div>
          ))}
        </div>

        <div className="sub-label" style={{ marginTop: 32 }}>
          Desktop · 12 col · 24 gutter · 80 outer margin
        </div>
        <div className="grid-demo">
          <div className="grid-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="col" key={i} />
            ))}
          </div>
        </div>

        <div className="sub-label" style={{ marginTop: 32 }}>
          Mobile · 4 col · 16 gutter · 16 outer margin
        </div>
        <div className="grid-demo" style={{ maxWidth: 380 }}>
          <div className="grid-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="col" key={i} />
            ))}
          </div>
        </div>

        <div className="sub-label" style={{ marginTop: 32 }}>
          Bento — dashboards only
        </div>
        <div className="grid-demo">
          <div className="bento">
            <div className="tile span-8">
              <h5>Today's bookings</h5>
              <div className="v mono">17</div>
              <div
                style={{
                  height: 80,
                  marginTop: 16,
                  background:
                    "linear-gradient(180deg, rgba(232,169,122,0.20), transparent)",
                  borderRadius: 8,
                  position: "relative",
                }}
              >
                <svg
                  width="100%"
                  height="80"
                  viewBox="0 0 400 80"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 60 L50 50 L100 55 L150 30 L200 35 L250 20 L300 28 L350 12 L400 18"
                    stroke="#E8A97A"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <div className="tile span-4">
              <h5>Settlement</h5>
              <div className="v mono">₩ 4.82M</div>
              <div
                className="caption"
                style={{ color: "var(--semantic-success)", marginTop: 8 }}
              >
                ▲ 12.4%
              </div>
            </div>
            <div className="tile span-6">
              <h5>Top services</h5>
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span>Korean Layered Cut</span>
                  <span className="mono">42</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span>Glass Skin Makeup</span>
                  <span className="mono">28</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span>Personal Color</span>
                  <span className="mono">19</span>
                </div>
              </div>
            </div>
            <div className="tile span-6">
              <h5>Inbox · pending</h5>
              <div
                style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13 }}
              >
                <div className="kr">🇯🇵 Sakura · 5월 4일 14시 가능할까요?</div>
                <div className="kr">🇨🇳 Mei · 想預約週六下午…</div>
                <div className="kr">🇻🇳 Linh · Còn slot ngày mai không?</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- SECTION 9 — A11Y ---------------------------------------------------
function Section9() {
  return (
    <section className="ds-section" id="s9">
      <div className="page">
        <SectionHead3
          num="09"
          eyebrow="Accessibility"
          title={
            <>
              The system <em>makes way</em> for everyone.
            </>
          }
          desc="WCAG 2.2 AA · Apple HIG · prefers-reduced-motion · prefers-color-scheme dark · focus-visible everywhere."
        />
        <div className="a11y-panel">
          <h3>Accessibility checklist for every Hesya screen.</h3>
          <ul>
            <li>
              <span className="check">✓</span>
              <span>
                All text/background pairs meet <b>≥ 4.5:1 contrast</b> (WCAG 2.2
                AA). Body on cream is verified at 8.2:1.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                Touch targets <b>≥ 44×44px</b> (Apple HIG) and{" "}
                <b>≥ 24×24px CSS box</b> (WCAG 2.2 success criterion 2.5.8).
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                All interactive elements have a visible{" "}
                <span className="focus-demo">:focus-visible</span> ring —
                amber-500, 2px outline, 2px offset.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                All form fields have associated <code>&lt;label&gt;</code>{" "}
                elements — never placeholder-only.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                <code>prefers-reduced-motion: reduce</code> is respected
                globally; all durations collapse to 0.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                <code>prefers-color-scheme: dark</code> activates the full dark
                companion theme from Section 02.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                Korean text never receives{" "}
                <code>text-transform: uppercase</code> or{" "}
                <code>letter-spacing &gt; 0.02em</code>.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

window.Section6 = Section6;
window.Section7 = Section7;
window.Section8 = Section8;
window.Section9 = Section9;
