/* global React */
const { useState: useStateM } = React;
const IconM = window.__hesyaIcons;

const PAST_BOOKINGS = [
  {
    id: 1,
    salon: "Stylista — Hongdae",
    svc: "Korean Layered Cut",
    date: "Mar 12, 2026",
    total: "₩85,000",
    rating: 5,
    color: "#E8A97A",
  },
  {
    id: 2,
    salon: "Glow Lab — Gangnam",
    svc: "Korean Glow Makeup",
    date: "Mar 14, 2026",
    total: "₩120,000",
    rating: 5,
    color: "#F8D7C8",
  },
  {
    id: 3,
    salon: "Mool Nails — Seongsu",
    svc: "Gel Nail Art",
    date: "Sep 22, 2025",
    total: "₩68,000",
    rating: 4,
    color: "#D88B5B",
  },
  {
    id: 4,
    salon: "Hue Studio — Itaewon",
    svc: "Personal Color Diagnosis",
    date: "Sep 24, 2025",
    total: "₩95,000",
    rating: 5,
    color: "#E8C4D6",
  },
];

const SAVED = [
  {
    id: 1,
    name: "Stylista — Hongdae",
    area: "Hair · Hongdae",
    rating: 4.9,
    price: "₩85k",
    color: "#E8A97A",
  },
  {
    id: 2,
    name: "Soyo Beauty",
    area: "Makeup · Seongsu",
    rating: 4.8,
    price: "₩120k",
    color: "#F8D7C8",
  },
  {
    id: 3,
    name: "Mool Nails",
    area: "Nail · Seongsu",
    rating: 4.95,
    price: "₩68k",
    color: "#D88B5B",
  },
  {
    id: 4,
    name: "Hue Studio",
    area: "Color · Itaewon",
    rating: 4.85,
    price: "₩95k",
    color: "#E8C4D6",
  },
  {
    id: 5,
    name: "Petit Salon",
    area: "Hair · Apgujeong",
    rating: 4.7,
    price: "₩105k",
    color: "#F5DDC8",
  },
  {
    id: 6,
    name: "Lumière K",
    area: "Makeup · Cheongdam",
    rating: 4.92,
    price: "₩140k",
    color: "#E8A97A",
  },
];

const REVIEWS_TODO = [
  {
    id: 1,
    salon: "Glow Lab — Gangnam",
    svc: "Korean Glow Makeup",
    date: "Mar 14, 2026",
    color: "#F8D7C8",
  },
  {
    id: 2,
    salon: "Mool Nails — Seongsu",
    svc: "Gel Nail Art",
    date: "Sep 22, 2025",
    color: "#D88B5B",
  },
];

function StarRow({ value, onChange, size = 22 }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= value ? "s on" : "s"}
          onClick={() => onChange && onChange(i)}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function Upcoming() {
  return (
    <div className="tab-pane">
      <div className="upcoming-card">
        {/* Mini timeline */}
        <div className="mini-tl">
          {["Apr 14", "Apr 15", "Apr 16", "Apr 17", "Apr 18"].map((d, i) => (
            <div
              key={i}
              className={`tl-cell${i === 1 ? " today" : ""}${i === 2 ? " booked" : ""}`}
            >
              <span className="tl-d">{d.split(" ")[1]}</span>
              <span className="tl-m">{d.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div className="up-when">
          Tomorrow at <em>14:00</em>
        </div>

        <div className="up-salon">
          <div
            className="up-photo"
            style={{ background: "linear-gradient(135deg, #E8A97A, #D88B5B)" }}
          >
            <span>S</span>
          </div>
          <div className="up-info">
            <div className="up-name">Stylista — Hongdae</div>
            <div className="up-svc">
              Korean Layered Cut + Treatment · 2.5 hrs
            </div>
            <div className="up-stylist">w/ Minji Kim 박민지</div>
          </div>
        </div>

        <div className="up-actions">
          <button className="up-pill primary">
            <IconM.qr size={14} /> Show QR
          </button>
          <button className="up-pill">
            <IconM.pin size={14} /> Directions
          </button>
          <button className="up-pill">
            <IconM.message size={14} /> Chat
          </button>
        </div>

        <div className="up-defensive">
          <a>Modify booking</a>
          <span>·</span>
          <a>Cancel</a>
        </div>
      </div>

      <div className="reminder-strip">
        <span className="rs-icon">🔔</span>
        <span>
          We'll send a reminder <b>1 hour before</b>.
        </span>
      </div>
    </div>
  );
}

function Past() {
  return (
    <div className="tab-pane past-list">
      {PAST_BOOKINGS.map((b) => (
        <div className="past-card" key={b.id}>
          <div
            className="past-photo"
            style={{
              background: `linear-gradient(135deg, ${b.color}, var(--hesya-amber-600))`,
            }}
          >
            <span>{b.salon[0]}</span>
          </div>
          <div className="past-info">
            <div className="past-salon">{b.salon}</div>
            <div className="past-svc">{b.svc}</div>
            <div className="past-meta">
              {b.date} · {b.total}
            </div>
            <div className="past-stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= b.rating ? "ps on" : "ps"}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <button className="ghost-btn">Book again</button>
        </div>
      ))}
    </div>
  );
}

function Saved() {
  return (
    <div className="tab-pane saved-grid">
      {SAVED.map((s) => (
        <div className="saved-card" key={s.id}>
          <div
            className="saved-img"
            style={{
              background: `linear-gradient(135deg, ${s.color}, var(--hesya-amber-600))`,
            }}
          >
            <span className="heart">♥</span>
          </div>
          <div className="saved-body">
            <div className="saved-name">{s.name}</div>
            <div className="saved-area">{s.area}</div>
            <div className="saved-meta">
              <span className="saved-rating">★ {s.rating}</span>
              <span className="saved-price">{s.price}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ b }) {
  const [stars, setStars] = useStateM(0);
  const [text, setText] = useStateM("");
  return (
    <div className="review-card">
      <div className="rv-header">
        <div
          className="rv-photo"
          style={{
            background: `linear-gradient(135deg, ${b.color}, var(--hesya-amber-600))`,
          }}
        >
          <span>{b.salon[0]}</span>
        </div>
        <div>
          <div className="rv-q">
            How was your visit to <em>{b.salon}</em>?
          </div>
          <div className="rv-meta">
            {b.svc} · {b.date}
          </div>
        </div>
      </div>
      <StarRow value={stars} onChange={setStars} size={28} />
      <textarea
        placeholder="Tell future travelers what to expect…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="rv-foot">
        <span className="rv-note">
          🌐 Reviews stay in your language — we translate for future travelers.
        </span>
        <button
          className={"rv-submit" + (stars > 0 ? " ready" : "")}
          disabled={stars === 0}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function Reviews() {
  return (
    <div className="tab-pane reviews-list">
      {REVIEWS_TODO.map((b) => (
        <ReviewCard key={b.id} b={b} />
      ))}
      <div className="rv-skip">
        Don't want to? <a>Skip all reviews</a>
      </div>
    </div>
  );
}

function MyPage() {
  const [tab, setTab] = useStateM("upcoming");

  return (
    <div className="my-stage">
      <div className="iphone-my">
        <div className="notch" />

        {/* Header */}
        <div className="my-header">
          <div className="my-top-row">
            <div className="my-avatar">
              <span>S</span>
            </div>
            <div className="my-greet">
              <h1>
                Hi, <em>Sakura</em>
              </h1>
              <div className="my-traveler">
                <span>🇯🇵 ja-JP</span>
                <span className="dvd">·</span>
                <span>📍 Tokyo</span>
                <span className="dvd">·</span>
                <span>✈️ Trip 4 · Apr 14–18, 2026</span>
              </div>
            </div>
            <button className="cog-btn">
              <IconM.settings size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          <div
            className={`tab${tab === "upcoming" ? " active" : ""}`}
            onClick={() => setTab("upcoming")}
          >
            Upcoming <span className="tcount">1</span>
          </div>
          <div
            className={`tab${tab === "past" ? " active" : ""}`}
            onClick={() => setTab("past")}
          >
            Past <span className="tcount">4</span>
          </div>
          <div
            className={`tab${tab === "saved" ? " active" : ""}`}
            onClick={() => setTab("saved")}
          >
            Saved <span className="tcount">12</span>
          </div>
          <div
            className={`tab${tab === "reviews" ? " active" : ""}`}
            onClick={() => setTab("reviews")}
          >
            Reviews <span className="tcount alert">2</span>
          </div>
        </div>

        {/* Tab pane */}
        <div className="tab-scroll" key={tab}>
          {tab === "upcoming" && <Upcoming />}
          {tab === "past" && <Past />}
          {tab === "saved" && <Saved />}
          {tab === "reviews" && <Reviews />}

          {/* Perks band */}
          <div className="perks-band">
            <div className="perks-card">
              <div className="perks-row">
                <span className="perks-emo">🎉</span>
                <div className="perks-text">
                  <div className="perks-title">3 bookings completed</div>
                  <div className="perks-sub">
                    Next visit · <b>5% off</b>
                  </div>
                </div>
              </div>
              <div className="perks-bar">
                <div className="perks-fill" style={{ width: "60%" }} />
                <div className="perks-marks">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={i <= 3 ? "pm done" : "pm"} />
                  ))}
                </div>
              </div>
              <div className="perks-foot">3 of 5 · two more for the perk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MyPage />);
