/* global React */
const { useState: useStateB } = React;
const IconB = window.__hesyaIcons;

// Pseudo-random QR pattern (deterministic seed)
function makeQR() {
  const cells = [];
  for (let i = 0; i < 21 * 21; i++) {
    const x = i % 21,
      y = Math.floor(i / 21);
    // 3 finder corners
    const inFinder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (inFinder) {
      const cx = x < 7 ? 3 : x > 13 ? 17 : 0;
      const cy = y < 7 ? 3 : y > 13 ? 17 : 0;
      const dx = Math.abs(x - cx),
        dy = Math.abs(y - cy);
      const m = Math.max(dx, dy);
      cells.push(m === 0 || m === 2 || m === 3 ? 1 : 0);
    } else {
      // pseudo-random
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      cells.push(seed - Math.floor(seed) > 0.55 ? 1 : 0);
    }
  }
  return cells;
}
const QR_CELLS = makeQR();

function HandBow() {
  return (
    <svg viewBox="0 0 200 110" fill="none">
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* head */}
        <circle cx="100" cy="35" r="14" className="draw" />
        {/* hair tuft */}
        <path d="M86 28 Q88 18 100 18 Q112 18 114 28" className="draw" />
        {/* body / shoulders bowing */}
        <path d="M70 80 Q76 60 90 50 L110 50 Q124 60 130 80" className="draw" />
        {/* arm crossing */}
        <path d="M82 70 Q100 76 118 70" className="draw" />
        {/* sparkles */}
        <path d="M40 30 v8 M36 34 h8" className="draw" />
        <path d="M160 50 v6 M157 53 h6" className="draw" />
        <path d="M50 80 v4 M48 82 h4" className="draw" />
      </g>
    </svg>
  );
}

function HandBowSmall() {
  return (
    <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      >
        <circle cx="30" cy="14" r="6" />
        <path d="M22 36 Q24 24 30 20 L30 20 Q36 24 38 36" />
        <path d="M25 30 Q30 33 35 30" />
        <path d="M10 12 v4 M8 14 h4" />
        <path d="M50 22 v3 M48.5 23.5 h3" />
      </g>
    </svg>
  );
}

function Booking() {
  const [tab, setTab] = useStateB("Apple");
  return (
    <div className="bc-stage">
      <div className="iphone-bc">
        <div className="notch" />
        <div className="scroll-bc">
          {/* Hero */}
          <div className="bc-hero">
            <div className="ill">
              <HandBow />
            </div>
            <div className="calligraphy">환대 · hospitality</div>
            <h1>You're booked, Sakura.</h1>
            <div className="sub">
              We told the salon. They're excited to host you.
            </div>
          </div>

          {/* QR card */}
          <div className="qr-card">
            <div className="share-btn">
              <IconB.arrowUR size={14} />
            </div>
            <div className="salon-line">
              스타일리스타 홍대점 · Stylista — Hongdae
            </div>
            <div className="qr-box">
              <div className="qr-pattern">
                {QR_CELLS.map((c, i) => (
                  <div key={i} className="px" style={{ opacity: c ? 1 : 0 }} />
                ))}
              </div>
            </div>
            <div className="booking-id">HSYA-2026-A4F8</div>
            <div className="desk-line">Show this at the front desk</div>
          </div>

          {/* Story share card */}
          <div className="story-share">
            <h3>Share the moment / 추억으로 남겨요</h3>
            <div className="ss-sub">
              Auto-formatted for Instagram Story or Xiaohongshu vertical post
            </div>
            <div className="story-frame">
              <div className="share-card-bc">
                <div className="ss-illust">
                  <HandBowSmall />
                </div>
                <div className="ss-mid">
                  <div className="ss-brand">Hesya · Booked!</div>
                  <div className="ss-name">Sakura</div>
                  <div className="ss-meta">
                    <div>✂️ Korean Layered Cut</div>
                    <div>📅 2026.04.15 · 14:00</div>
                    <div>📍 Stylista — Hongdae</div>
                  </div>
                </div>
                <div className="ss-bottom">
                  <div className="ss-qr" />
                  <div className="ss-tag">
                    The Korean welcome,
                    <br />
                    in 5 languages
                  </div>
                </div>
                <div className="ss-handle">@stylistastudio</div>
              </div>
              <div className="story-actions">
                <div className="ss-btn primary">
                  <span className="ico">📷</span>
                  <span className="lab">Save to Story</span>
                </div>
                <div className="ss-btn">
                  <span className="ico">💬</span>
                  <span className="lab">Send via DM</span>
                </div>
                <div className="ss-btn">
                  <span className="ico">🔗</span>
                  <span className="lab">Copy link</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment */}
          <div className="appt-card">
            <div className="appt-row">
              <span className="ico">📅</span>
              <div>
                <b>Wed 15 Apr 2026</b> · 14:00–16:30
              </div>
            </div>
            <div className="appt-row">
              <span className="ico">✂️</span>
              <div>Korean Layered Cut + Treatment</div>
            </div>
            <div className="appt-row">
              <span className="ico">💁</span>
              <div>
                Stylist · <b>Minji Kim</b> 박민지
              </div>
            </div>
            <div className="appt-row">
              <span className="ico">📍</span>
              <div>
                Stylista — Hongdae
                <br />
                <span className="due">15 min walk · 홍대입구역</span>
              </div>
            </div>
            <div className="appt-row">
              <span className="ico">💵</span>
              <div>
                Paid <b>₩25,500</b>
                <span className="price-due">Due at salon · ₩59,500</span>
              </div>
            </div>
            <button className="add-cal">
              <IconB.calendar size={12} /> Add to calendar
            </button>
          </div>

          {/* Map */}
          <div className="map-card">
            <div className="map-img">
              <div className="pin">📍</div>
              <div className="dist">15 min walk · 1.1 km</div>
            </div>
            <div className="map-pills">
              <span
                className={"map-pill" + (tab === "Apple" ? " def" : "")}
                onClick={() => setTab("Apple")}
              >
                Apple Maps
              </span>
              <span
                className={"map-pill" + (tab === "Google" ? " def" : "")}
                onClick={() => setTab("Google")}
              >
                Google Maps
              </span>
              <span
                className={"map-pill" + (tab === "Naver" ? " def" : "")}
                onClick={() => setTab("Naver")}
              >
                Naver Map · 추천
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline">
            <h3>What happens next</h3>
            {[
              [
                "📩",
                "1 hour before",
                "We'll send you a reminder + last-minute prep tips.",
              ],
              [
                "🚇",
                "At the salon",
                "Show this QR to the front desk. They have your name.",
              ],
              [
                "🌐",
                "Need help?",
                "Tap Chat in the bottom bar to talk to staff in your language.",
              ],
              ["💌", "After your visit", "We'll ask for a quick review."],
              [
                "🎁",
                "Share + earn",
                "Share your look with friends and earn 10% off your next K-beauty trip.",
              ],
            ].map(([ic, t, b], i) => (
              <div className="tl-step" key={i}>
                <div className="ico">{ic}</div>
                <div className="body">
                  <div className="ttl">{t}</div>
                  <p>{b}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Safety reminders (first booking) */}
          <div className="safety-bc">
            <h4>Quick safety tips · 안전한 방문을 위해</h4>
            <ul>
              <li>
                매장 도착하면 인박스 채팅으로 알려주세요. We'll check on you.
              </li>
              <li>시술 중 통역 필요하면 태블릿 QR 스캔 하나로 시작.</li>
              <li>비상시 · 한국 112 또는 매장 직통 070-XXXX</li>
            </ul>
            <div className="first-only">
              이 안내는 첫 방문 손님에게만 표시돼요. Shown only on your first
              booking.
            </div>
          </div>

          {/* Defensive */}
          <div className="defensive">
            <span className="link">Modify booking →</span>
            <span className="div">·</span>
            <span className="link">Cancel booking →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Booking />);
