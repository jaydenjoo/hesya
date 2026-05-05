/* global React */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;
const IconS = window.__hesyaIcons;

// ── Stylist data ──────────────────────────────────
const STYLISTS = [
  {
    id: "minji",
    name: "Minji Kim",
    kr: "박민지",
    rating: 4.9,
    reviews: 89,
    langs: ["🇺🇸", "🇯🇵"],
    color: "#E8A97A",
  },
  {
    id: "jiyeon",
    name: "Jiyeon Park",
    kr: "박지연",
    rating: 4.8,
    reviews: 142,
    langs: ["🇺🇸", "🇨🇳"],
    color: "#D88B5B",
  },
  {
    id: "soyoung",
    name: "Soyoung Lee",
    kr: "이소영",
    rating: 4.95,
    reviews: 67,
    langs: ["🇺🇸"],
    color: "#F8D7C8",
  },
];

// ── Time slot data (deterministic for Wed Apr 15) ──
function makeSlots() {
  const slots = [];
  for (let h = 10; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      // pseudo-random state
      const seed = Math.sin(h * 7 + m) * 1000;
      const r = seed - Math.floor(seed);
      let state,
        stylist = null,
        fewLeft = 0;
      if (r < 0.25) state = "booked";
      else if (r < 0.4) {
        state = "few";
        fewLeft = (Math.floor(r * 10) % 2) + 1;
      } else state = "available";
      // assign stylist availability
      if (state !== "booked") {
        const sIdx = Math.floor((seed * 13 - Math.floor(seed * 13)) * 3);
        stylist = STYLISTS[Math.abs(sIdx) % 3].id;
      }
      slots.push({ time, state, stylist, fewLeft });
    }
  }
  return slots;
}
const SLOTS = makeSlots();

// ── Week-strip data ──
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_KR = ["일", "월", "화", "수", "목", "금", "토"];
function makeDays(startDate, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    // pseudo availability dot
    const seed = Math.sin(d.getDate() * 9.7) * 100;
    const r = seed - Math.floor(seed);
    const avail = r < 0.15 ? "full" : r < 0.45 ? "few" : "open";
    out.push({
      date: d.getDate(),
      month: d.getMonth() + 1,
      enWk: WEEKDAYS_EN[dow],
      krWk: WEEKDAYS_KR[dow],
      iso: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      avail,
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return out;
}
const DAYS = makeDays(new Date(2026, 3, 13), 21); // Mon Apr 13 → 21 days

function Schedule() {
  const [selectedDate, setSelectedDate] = useStateS("2026-4-15");
  const [selectedSlot, setSelectedSlot] = useStateS(null);
  const [orderOpen, setOrderOpen] = useStateS(false);
  const [showAlt, setShowAlt] = useStateS(false);
  const stripRef = useRefS();

  const slot = SLOTS.find((s) => s.time === selectedSlot);
  const recStylist = slot
    ? STYLISTS.find((st) => st.id === slot.stylist)
    : null;
  const canContinue = selectedDate && selectedSlot;

  const scrollWeek = (dir) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="sch-stage">
      <div className="iphone-sch">
        <div className="notch" />
        <div className="scroll-sch">
          {/* Top bar */}
          <div className="sch-top">
            <div className="back-btn">
              <IconS.chevR size={18} style={{ transform: "rotate(180deg)" }} />
            </div>
            <h1 className="sch-title">
              When works for <em>you?</em>
            </h1>
            <div className="sch-spacer" />
          </div>

          {/* Progress */}
          <div className="progress-strip">
            <div className="step done">
              <span className="dot" />
              <span className="lab">Schedule</span>
            </div>
            <div className="link done" />
            <div className="step active">
              <span className="dot" />
              <span className="lab">Stylist</span>
            </div>
            <div className="link" />
            <div className="step">
              <span className="dot" />
              <span className="lab">Confirm</span>
            </div>
            <div className="link" />
            <div className="step">
              <span className="dot" />
              <span className="lab">Pay</span>
            </div>
          </div>

          {/* Order summary collapsible */}
          <div
            className={"order-card" + (orderOpen ? " open" : "")}
            onClick={() => setOrderOpen(!orderOpen)}
          >
            <div className="order-row">
              <div className="order-ico">
                <IconS.scissors size={18} />
              </div>
              <div className="order-main">
                <div className="order-svc">Korean Layered Cut + Treatment</div>
                <div className="order-meta">
                  2.5 hrs · ₩85,000 <span className="alt">≈ ¥8,650</span>
                </div>
              </div>
              <IconS.chevR
                size={16}
                style={{
                  transform: orderOpen ? "rotate(90deg)" : "rotate(90deg)",
                  opacity: 0.5,
                }}
              />
            </div>
            {orderOpen && (
              <div className="order-expand">
                <div className="order-line">
                  Includes: consultation · cut · scalp treatment · blow-dry
                  style
                </div>
                <a className="order-edit" onClick={(e) => e.stopPropagation()}>
                  Change service →
                </a>
              </div>
            )}
          </div>

          {/* Date picker */}
          <div className="section-block">
            <div className="block-head">
              <div className="block-title">Pick a date</div>
              <div className="week-nav">
                <button onClick={() => scrollWeek(-1)} aria-label="prev">
                  <IconS.chevR
                    size={14}
                    style={{ transform: "rotate(180deg)" }}
                  />
                </button>
                <span>April 2026</span>
                <button onClick={() => scrollWeek(1)} aria-label="next">
                  <IconS.chevR size={14} />
                </button>
              </div>
            </div>
            <div className="week-strip" ref={stripRef}>
              {DAYS.map((d, i) => {
                const sel = d.iso === selectedDate;
                return (
                  <div
                    key={i}
                    className={`day-cell${sel ? " selected" : ""}${d.avail === "full" ? " full" : ""}`}
                    onClick={() => d.avail !== "full" && setSelectedDate(d.iso)}
                  >
                    <div className="dwk">
                      {d.enWk}
                      <span className="kr">/{d.krWk}</span>
                    </div>
                    <div className="dnum">{d.date}</div>
                    <span className={`avail-dot ${d.avail}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slot grid */}
          <div className="section-block">
            <div className="slots-title">
              Available times on <b>Wed Apr 15</b>
            </div>
            <div className="slot-grid">
              {SLOTS.map((s, i) => {
                const sel = s.time === selectedSlot;
                const stylistObj = STYLISTS.find((st) => st.id === s.stylist);
                return (
                  <div
                    key={i}
                    className={`slot ${s.state}${sel ? " selected" : ""}`}
                    onClick={() =>
                      s.state !== "booked" && setSelectedSlot(s.time)
                    }
                  >
                    <div className="slot-time">{s.time}</div>
                    {s.state === "few" && (
                      <div className="slot-cap">{s.fewLeft} left</div>
                    )}
                    {stylistObj && s.state !== "booked" && (
                      <span
                        className="stylist-dot"
                        style={{ background: stylistObj.color }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="slot-legend">
              <span>
                <i className="lg-dot avail" />
                Available
              </span>
              <span>
                <i className="lg-dot few" />
                Few left
              </span>
              <span>
                <i className="lg-dot booked" />
                Booked
              </span>
            </div>
          </div>

          {/* Stylist suggestion (animated reveal) */}
          {recStylist && (
            <div className="stylist-rec" key={selectedSlot}>
              <div className="rec-label">
                Recommended for <b>{selectedSlot}</b>
              </div>
              <div className="rec-card">
                <div
                  className="rec-photo"
                  style={{
                    background: `linear-gradient(135deg, ${recStylist.color} 0%, var(--hesya-amber-600) 100%)`,
                  }}
                >
                  <span className="rec-initial">{recStylist.name[0]}</span>
                </div>
                <div className="rec-body">
                  <div className="rec-name">
                    {recStylist.name}{" "}
                    <span className="rec-kr">{recStylist.kr}</span>
                  </div>
                  <div className="rec-meta">
                    <span className="rec-stars">
                      ★ {recStylist.rating}{" "}
                      <span className="rev">({recStylist.reviews})</span>
                    </span>
                    <span className="rec-langs">
                      {recStylist.langs.join(" ")}
                    </span>
                  </div>
                  <a className="rec-portfolio">View portfolio →</a>
                </div>
              </div>
              <a className="rec-alt" onClick={() => setShowAlt(!showAlt)}>
                {showAlt
                  ? "Hide alternatives ↑"
                  : "See other available stylists ↓"}
              </a>
              {showAlt && (
                <div className="alt-list">
                  {STYLISTS.filter((s) => s.id !== recStylist.id).map((s) => (
                    <div className="alt-row" key={s.id}>
                      <div
                        className="alt-avatar"
                        style={{ background: s.color }}
                      >
                        {s.name[0]}
                      </div>
                      <div className="alt-info">
                        <div className="alt-name">
                          {s.name} <span className="alt-kr">{s.kr}</span>
                        </div>
                        <div className="alt-meta">
                          ★ {s.rating} ({s.reviews}) · {s.langs.join(" ")}
                        </div>
                      </div>
                      <span className="alt-pick">Pick →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deposit policy — always visible */}
          <div className="deposit-card">
            <div className="dep-header">
              <IconS.shield size={16} />
              <span>Deposit & cancellation</span>
            </div>
            <p>
              <b>30% deposit (₩25,500)</b> holds your slot. Full refund if you
              cancel within 24 hrs. No-show = deposit forfeited.{" "}
              <span className="dep-warm">We hate surprises too.</span>
            </p>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="sticky-bar">
          <div className="bar-left">
            <div className="bar-total-lab">Total · 합계</div>
            <div className="bar-total">
              ₩85,000 <span className="alt">≈ ¥8,650</span>
            </div>
          </div>
          <button
            className={"bar-cta" + (canContinue ? "" : " disabled")}
            disabled={!canContinue}
          >
            Continue to payment <IconS.chevR size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Schedule />);
