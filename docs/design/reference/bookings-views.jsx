/* global React */
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

/* ──────────────── App chrome (re-uses sd-* from dashboard.css) ──────────────── */
function TopHeader() {
  return (
    <header className="sd-topbar">
      <div className="sd-brand">
        <span className="sd-brand-mark">Hesya</span>
        <span className="sd-brand-tag kr">Store</span>
      </div>
      <div className="sd-search">
        <span className="sd-search-icon">⌕</span>
        <input placeholder="검색 — 손님, 예약, 시술…" />
        <kbd className="sd-kbd">⌘K</kbd>
      </div>
      <div className="sd-top-actions">
        <button className="sd-icon-btn">
          <span>🔔</span>
          <span className="sd-pulse-badge">3</span>
        </button>
        <button className="sd-lang">
          🌐 <span>한</span>
          <span className="sd-lang-sep">/</span>
          <span>영</span>
        </button>
        <div className="sd-avatar">JY</div>
      </div>
    </header>
  );
}

function Sidebar() {
  const items = [
    { icon: "▦", label: "Dashboard" },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings", active: true },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers" },
    { icon: "◫", label: "Analytics" },
    { icon: "✦", label: "AI Photos" },
    { icon: "⚙", label: "Settings" },
  ];
  return (
    <aside className="sd-sidebar">
      <nav className="sd-nav">
        {items.map((it) => (
          <button
            key={it.label}
            className={"sd-nav-item" + (it.active ? " active" : "")}
          >
            <span className="sd-icon">{it.icon}</span>
            <span className="sd-label">{it.label}</span>
            {it.badge != null && <span className="sd-badge">{it.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sd-store">
        <div className="sd-store-logo">S</div>
        <div className="sd-store-meta">
          <div className="sd-store-name kr-display">Stylista 홍대점</div>
          <div className="sd-store-status">
            <span className="dot" />
            영업 중
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ──────────────── Constants ──────────────── */
const STYLISTS = [
  {
    id: "minji",
    name: "김민지",
    short: "민지",
    color: "var(--hesya-amber-500)",
    textColor: "#FFF",
  },
  {
    id: "soyeon",
    name: "이소연",
    short: "소연",
    color: "#C68B5C",
    textColor: "#FFF",
  },
  {
    id: "hyunjoo",
    name: "박현주",
    short: "현주",
    color: "var(--hesya-navy-900)",
    textColor: "#FFF",
  },
  {
    id: "yujin",
    name: "최유진",
    short: "유진",
    color: "#A47AB0",
    textColor: "#FFF",
  },
];
const stylistById = (id) => STYLISTS.find((s) => s.id === id);

const HOURS = Array.from({ length: 14 }, (_, i) => 9 + i); // 09→22
const DAYS = [
  { kr: "월", en: "MON", num: 14 },
  { kr: "화", en: "TUE", num: 15 },
  { kr: "수", en: "WED", num: 16, today: true },
  { kr: "목", en: "THU", num: 17 },
  { kr: "금", en: "FRI", num: 18 },
  { kr: "토", en: "SAT", num: 19 },
  { kr: "일", en: "SUN", num: 20 },
];

// Booking = { id, day, start, end, customer, kr, flag, foreign, service, stylist, status, paid, refund? }
const SEED_BOOKINGS = [
  {
    id: 1,
    day: 0,
    start: 10,
    end: 11.5,
    customer: "Sato Sakura",
    kr: "사쿠라",
    flag: "🇯🇵",
    foreign: true,
    service: "K-Beauty 메이크업",
    stylist: "minji",
    status: "confirmed",
    paid: 280000,
  },
  {
    id: 2,
    day: 0,
    start: 13,
    end: 14,
    customer: "김지영",
    kr: "김지영",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylist: "soyeon",
    status: "confirmed",
    paid: 45000,
  },
  {
    id: 3,
    day: 0,
    start: 15,
    end: 17,
    customer: "Wei Chen",
    kr: "웨이 첸",
    flag: "🇨🇳",
    foreign: true,
    service: "퍼스널컬러 + 메이크업",
    stylist: "minji",
    status: "pending",
    paid: 150000,
    vip: true,
  },
  {
    id: 4,
    day: 1,
    start: 9.5,
    end: 11,
    customer: "Emma Park",
    kr: "엠마 박",
    flag: "🇺🇸",
    foreign: true,
    service: "헤어 컬러",
    stylist: "hyunjoo",
    status: "confirmed",
    paid: 220000,
  },
  {
    id: 5,
    day: 1,
    start: 11.5,
    end: 12.5,
    customer: "박서윤",
    kr: "박서윤",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylist: "soyeon",
    status: "confirmed",
    paid: 45000,
  },
  {
    id: 6,
    day: 1,
    start: 14,
    end: 15.5,
    customer: "Yuki Tanaka",
    kr: "유키",
    flag: "🇯🇵",
    foreign: true,
    service: "K-Beauty 메이크업",
    stylist: "yujin",
    status: "confirmed",
    paid: 140000,
  },
  {
    id: 7,
    day: 1,
    start: 18,
    end: 20,
    customer: "Linh Pham",
    kr: "린",
    flag: "🇻🇳",
    foreign: true,
    service: "브라이덜 트라이얼",
    stylist: "minji",
    status: "pending",
    paid: 380000,
  },
  {
    id: 8,
    day: 2,
    start: 10,
    end: 11,
    customer: "Mei Zhang",
    kr: "메이",
    flag: "🇨🇳",
    foreign: true,
    service: "헤어컷",
    stylist: "soyeon",
    status: "noshow",
    paid: 0,
  },
  {
    id: 9,
    day: 2,
    start: 11.5,
    end: 13,
    customer: "Sakura Tanaka",
    kr: "사쿠라 다",
    flag: "🇯🇵",
    foreign: true,
    service: "헤어 + 메이크업",
    stylist: "minji",
    status: "confirmed",
    paid: 195000,
    current: true,
  },
  {
    id: 10,
    day: 2,
    start: 14,
    end: 15,
    customer: "이수진",
    kr: "이수진",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷",
    stylist: "hyunjoo",
    status: "confirmed",
    paid: 50000,
  },
  {
    id: 11,
    day: 2,
    start: 16,
    end: 18,
    customer: "Ana Silva",
    kr: "아나",
    flag: "🇧🇷",
    foreign: true,
    service: "퍼스널컬러",
    stylist: "yujin",
    status: "confirmed",
    paid: 90000,
  },
  {
    id: 12,
    day: 2,
    start: 19,
    end: 20.5,
    customer: "정유나",
    kr: "정유나",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어 컬러",
    stylist: "hyunjoo",
    status: "confirmed",
    paid: 180000,
  },
  {
    id: 13,
    day: 3,
    start: 10,
    end: 11.5,
    customer: "최수민",
    kr: "최수민",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어컷 + 펌",
    stylist: "soyeon",
    status: "confirmed",
    paid: 220000,
  },
  {
    id: 14,
    day: 3,
    start: 13,
    end: 14.5,
    customer: "Hana Kim",
    kr: "하나 김",
    flag: "🇺🇸",
    foreign: true,
    service: "K-Beauty 메이크업",
    stylist: "minji",
    status: "confirmed",
    paid: 140000,
  },
  {
    id: 15,
    day: 3,
    start: 16,
    end: 18,
    customer: "Wei Liu",
    kr: "웨이 류",
    flag: "🇨🇳",
    foreign: true,
    service: "헤어 컬러 + 메이크업",
    stylist: "yujin",
    status: "completed",
    paid: 240000,
  },
  {
    id: 16,
    day: 4,
    start: 11,
    end: 12.5,
    customer: "Yuki Sato",
    kr: "유키 사",
    flag: "🇯🇵",
    foreign: true,
    service: "퍼스널컬러",
    stylist: "hyunjoo",
    status: "confirmed",
    paid: 90000,
  },
  {
    id: 17,
    day: 4,
    start: 14,
    end: 16,
    customer: "박지민",
    kr: "박지민",
    flag: "🇰🇷",
    foreign: false,
    service: "브라이덜 트라이얼",
    stylist: "minji",
    status: "confirmed",
    paid: 380000,
    vip: true,
  },
  {
    id: 18,
    day: 4,
    start: 17,
    end: 18,
    customer: "Mai Pham",
    kr: "마이",
    flag: "🇻🇳",
    foreign: true,
    service: "헤어컷",
    stylist: "soyeon",
    status: "pending",
    paid: 50000,
  },
  {
    id: 19,
    day: 5,
    start: 10,
    end: 12,
    customer: "Emma Park",
    kr: "엠마",
    flag: "🇺🇸",
    foreign: true,
    service: "브라이덜 본식",
    stylist: "minji",
    status: "confirmed",
    paid: 580000,
    vip: true,
  },
  {
    id: 20,
    day: 5,
    start: 13,
    end: 14.5,
    customer: "Linh Tran",
    kr: "린 트",
    flag: "🇻🇳",
    foreign: true,
    service: "K-Beauty 메이크업",
    stylist: "yujin",
    status: "confirmed",
    paid: 140000,
  },
  {
    id: 21,
    day: 5,
    start: 15,
    end: 17,
    customer: "김미나",
    kr: "김미나",
    flag: "🇰🇷",
    foreign: false,
    service: "헤어 컬러 + 펌",
    stylist: "hyunjoo",
    status: "confirmed",
    paid: 280000,
  },
  {
    id: 22,
    day: 5,
    start: 18,
    end: 20,
    customer: "Sara Lee",
    kr: "사라",
    flag: "🇺🇸",
    foreign: true,
    service: "헤어 + 메이크업",
    stylist: "minji",
    status: "pending",
    paid: 280000,
  },
  {
    id: 23,
    day: 6,
    start: 11,
    end: 12.5,
    customer: "Yuki M.",
    kr: "유키 엠",
    flag: "🇯🇵",
    foreign: true,
    service: "헤어컷",
    stylist: "soyeon",
    status: "confirmed",
    paid: 50000,
  },
  {
    id: 24,
    day: 6,
    start: 14,
    end: 16,
    customer: "Wei Tan",
    kr: "웨이 탄",
    flag: "🇨🇳",
    foreign: true,
    service: "K-Beauty 풀세트",
    stylist: "minji",
    status: "confirmed",
    paid: 380000,
    vip: true,
  },
];

/* ──────────────── Header strip ──────────────── */
function HeaderStrip({ view, setView, filter, setFilter }) {
  const views = [
    { id: "week", icon: "📅", label: "캘린더" },
    { id: "month", icon: "▦", label: "월" },
    { id: "list", icon: "📋", label: "리스트" },
    { id: "timeline", icon: "⏱", label: "타임라인" },
  ];
  const filters = [
    { id: "all", label: "전체", n: 24 },
    { id: "foreign", label: "외국인만", n: 16 },
    { id: "confirmed", label: "확정", n: 18 },
    { id: "pending", label: "보류", n: 4 },
    { id: "noshow", label: "노쇼", n: 1 },
  ];
  return (
    <div className="bk-header">
      <div className="bk-header-l">
        <h1 className="bk-title kr-display">예약 관리</h1>
        <div className="bk-week-nav">
          <button className="bk-nav-btn" aria-label="이전 주">
            ‹
          </button>
          <span className="bk-week-label kr">
            2026.04.14 — 04.20 <span className="bk-week-meta">이번 주</span>
          </span>
          <button className="bk-nav-btn" aria-label="다음 주">
            ›
          </button>
          <button className="bk-today kr">오늘로</button>
        </div>
      </div>

      <div className="bk-view-toggle">
        {views.map((v) => (
          <button
            key={v.id}
            className={"bk-view-btn" + (view === v.id ? " active" : "")}
            onClick={() => setView(v.id)}
          >
            <span className="bk-view-icon">{v.icon}</span>
            <span className="kr">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="bk-filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            className={"bk-filter-pill" + (filter === f.id ? " active" : "")}
            onClick={() => setFilter(f.id)}
          >
            <span className="kr">{f.label}</span>
            <span className="bk-filter-n">{f.n}</span>
          </button>
        ))}
        <button className="bk-filter-pill bk-stylist-select kr">
          디자이너별 <span style={{ opacity: 0.5 }}>▾</span>
        </button>
      </div>

      <button className="bk-new-btn kr">
        <span style={{ fontSize: 16 }}>+</span>
        <span>새 예약</span>
        <kbd className="bk-new-kbd">⌘N</kbd>
      </button>
    </div>
  );
}

/* ──────────────── WEEK VIEW ──────────────── */
function BookingCard({ b, onClick, dragState, setDragState, selectedId }) {
  const stylist = stylistById(b.stylist);
  const top = (b.start - 9) * 56;
  const height = (b.end - b.start) * 56 - 4;

  const startDrag = (e) => {
    e.stopPropagation();
    setDragState({
      id: b.id,
      fromDay: b.day,
      fromStart: b.start,
      dx: 0,
      dy: 0,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const isDragging = dragState && dragState.id === b.id;

  return (
    <button
      className={
        "bk-card" +
        (b.foreign ? " foreign" : " local") +
        " status-" +
        b.status +
        (b.current ? " current" : "") +
        (selectedId === b.id ? " selected" : "") +
        (isDragging ? " dragging" : "")
      }
      style={{
        top: top + "px",
        height: height + "px",
        borderLeftColor: stylist.color,
        ...(isDragging
          ? {
              transform: `translate(${dragState.dx}px, ${dragState.dy}px)`,
              zIndex: 50,
            }
          : {}),
      }}
      onClick={() => onClick(b)}
      onMouseDown={startDrag}
    >
      {b.foreign && <span className="bk-card-flag">{b.flag}</span>}
      {b.status === "completed" && <span className="bk-card-corner ok">✓</span>}
      {b.status === "noshow" && <span className="bk-card-corner danger" />}
      {b.status === "pending" && <span className="bk-card-stripe" />}
      {b.vip && <span className="bk-card-vip">★</span>}
      <div className="bk-card-time mono">
        {Math.floor(b.start).toString().padStart(2, "0")}:
        {(b.start % 1) * 60 || "00"}
        <span className="bk-card-dur"> · {((b.end - b.start) * 60) | 0}m</span>
      </div>
      <div className="bk-card-name kr">{b.kr}</div>
      <div className="bk-card-service kr">{b.service}</div>
      <div className="bk-card-stylist" style={{ color: stylist.color }}>
        <span
          className="bk-stylist-dot"
          style={{ background: stylist.color }}
        />
        <span className="kr">{stylist.short}</span>
      </div>
      <div className="bk-card-resize" />
    </button>
  );
}

function WeekGrid({ onSelect, selectedId }) {
  const [bookings, setBookings] = useS(SEED_BOOKINGS);
  const [dragState, setDragState] = useS(null);
  const [snapPreview, setSnapPreview] = useS(null);
  const gridRef = useR(null);

  useE(() => {
    if (!dragState) return;
    const onMove = (e) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setDragState((s) => (s ? { ...s, dx, dy } : null));
      // compute snap preview
      const colW =
        gridRef.current?.querySelector(".bk-week-col")?.getBoundingClientRect()
          .width || 130;
      const dayShift = Math.round(dx / colW);
      const halfHourShift = Math.round(dy / 28);
      const newDay = Math.max(0, Math.min(6, dragState.fromDay + dayShift));
      const newStart = Math.max(
        9,
        Math.min(21, dragState.fromStart + halfHourShift * 0.5),
      );
      setSnapPreview({ day: newDay, start: newStart });
    };
    const onUp = () => {
      if (snapPreview) {
        setBookings((bs) =>
          bs.map((b) =>
            b.id === dragState.id
              ? {
                  ...b,
                  day: snapPreview.day,
                  start: snapPreview.start,
                  end: snapPreview.start + (b.end - b.start),
                }
              : b,
          ),
        );
      }
      setDragState(null);
      setSnapPreview(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, snapPreview]);

  return (
    <div className="bk-week" ref={gridRef}>
      <div className="bk-week-head">
        <div className="bk-week-gutter" />
        {DAYS.map((d, i) => (
          <div
            key={i}
            className={"bk-week-day-head" + (d.today ? " today" : "")}
          >
            <div className="bk-day-en">{d.en}</div>
            <div className="bk-day-num kr-display">
              {d.num}
              <span className="bk-day-kr"> · {d.kr}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bk-week-body">
        <div className="bk-hour-gutter">
          {HOURS.map((h) => (
            <div key={h} className="bk-hour-row">
              <span className="mono">{h.toString().padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {DAYS.map((d, i) => (
          <div
            key={i}
            className={"bk-week-col" + (d.today ? " today-col" : "")}
          >
            {HOURS.map((h) => (
              <div key={h} className="bk-hour-cell">
                <div className="bk-half-line" />
              </div>
            ))}
            {d.today && (
              <div
                className="bk-now-line"
                style={{ top: (14 + 24 / 60 - 9) * 56 + "px" }}
              >
                <span className="bk-now-dot" />
                <span className="bk-now-label kr mono">14:24</span>
              </div>
            )}
            {bookings
              .filter((b) => b.day === i)
              .map((b) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  onClick={onSelect}
                  dragState={dragState}
                  setDragState={setDragState}
                  selectedId={selectedId}
                />
              ))}
            {snapPreview &&
              snapPreview.day === i &&
              (() => {
                const orig = bookings.find((b) => b.id === dragState.id);
                if (!orig) return null;
                const dur = orig.end - orig.start;
                return (
                  <div
                    className="bk-snap-ghost"
                    style={{
                      top: (snapPreview.start - 9) * 56 + "px",
                      height: dur * 56 - 4 + "px",
                    }}
                  >
                    <div className="bk-snap-time mono">
                      {Math.floor(snapPreview.start)
                        .toString()
                        .padStart(2, "0")}
                      :{(snapPreview.start % 1) * 60 || "00"}
                    </div>
                  </div>
                );
              })()}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── MONTH VIEW ──────────────── */
function MonthGrid({ onSelect }) {
  const days = [];
  // April 2026: Apr 1 = Wed → 2 leading blanks (Mon, Tue)
  for (let i = 0; i < 2; i++) days.push({ blank: true });
  for (let d = 1; d <= 30; d++) {
    const fc = (d * 7) % 5; // pseudo foreign count
    const lc = (d * 3) % 4;
    days.push({ d, fc, lc, today: d === 16, week: d >= 14 && d <= 20 });
  }
  while (days.length % 7 !== 0) days.push({ blank: true });

  return (
    <div className="bk-month">
      <div className="bk-month-head">
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
          <div key={d} className="bk-month-dow kr">
            {d}
          </div>
        ))}
      </div>
      <div className="bk-month-grid">
        {days.map((day, i) => (
          <div
            key={i}
            className={
              "bk-month-cell" +
              (day.blank ? " blank" : "") +
              (day.today ? " today" : "") +
              (day.week ? " in-week" : "")
            }
            onClick={() => !day.blank && onSelect && onSelect()}
          >
            {!day.blank && (
              <>
                <div className="bk-month-num kr-display">{day.d}</div>
                <div className="bk-month-dots">
                  {Array.from({ length: day.fc }, (_, j) => (
                    <span key={"f" + j} className="bk-mdot foreign" />
                  ))}
                  {Array.from({ length: day.lc }, (_, j) => (
                    <span key={"l" + j} className="bk-mdot local" />
                  ))}
                </div>
                {day.fc + day.lc > 0 && (
                  <div className="bk-month-meta mono">
                    {day.fc + day.lc}{" "}
                    <span className="bk-month-fc">· 외 {day.fc}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── LIST VIEW ──────────────── */
function ListView({ onSelect, selectedId }) {
  const [sort, setSort] = useS({ key: "start", dir: "asc" });
  const [dense, setDense] = useS(false);

  const sorted = [...SEED_BOOKINGS].sort((a, b) => {
    if (sort.key === "start")
      return (
        (a.day * 24 + a.start - (b.day * 24 + b.start)) *
        (sort.dir === "asc" ? 1 : -1)
      );
    return 0;
  });

  const fmtTime = (t) =>
    Math.floor(t).toString().padStart(2, "0") +
    ":" +
    ((t % 1) * 60 || 0).toString().padStart(2, "0");
  const STATUS = {
    confirmed: { kr: "확정", color: "var(--semantic-success)" },
    pending: { kr: "보류", color: "var(--semantic-warning)" },
    noshow: { kr: "노쇼", color: "var(--semantic-danger)" },
    completed: { kr: "완료", color: "var(--gray-500)" },
  };

  return (
    <div className="bk-list">
      <div className="bk-list-toolbar">
        <span className="kr bk-list-count">
          {sorted.length}건 · 외국인 {sorted.filter((b) => b.foreign).length}건
        </span>
        <button
          className={"bk-density-toggle" + (dense ? " active" : "")}
          onClick={() => setDense(!dense)}
        >
          <span className="kr">{dense ? "조밀" : "기본"}</span>
        </button>
      </div>
      <div className={"bk-table" + (dense ? " dense" : "")}>
        <div className="bk-tr bk-th">
          <div className="bk-td-date kr">날짜</div>
          <div className="bk-td-time kr">시간</div>
          <div className="bk-td-cust kr">손님</div>
          <div className="bk-td-svc kr">시술</div>
          <div className="bk-td-styl kr">디자이너</div>
          <div className="bk-td-status kr">상태</div>
          <div className="bk-td-paid kr">결제</div>
          <div className="bk-td-act kr"></div>
        </div>
        {sorted.map((b) => {
          const st = STATUS[b.status];
          const stylist = stylistById(b.stylist);
          return (
            <div
              key={b.id}
              className={"bk-tr" + (selectedId === b.id ? " selected" : "")}
              onClick={() => onSelect(b)}
            >
              <div className="bk-td-date mono">04.{14 + b.day}</div>
              <div className="bk-td-time mono">{fmtTime(b.start)}</div>
              <div className="bk-td-cust">
                <span className="bk-list-flag">{b.flag}</span>
                <span
                  className={"bk-list-cust-name " + (b.foreign ? "kr" : "kr")}
                >
                  {b.kr}
                </span>
                {b.vip && <span className="bk-list-vip">★</span>}
              </div>
              <div className="bk-td-svc kr">{b.service}</div>
              <div className="bk-td-styl">
                <span
                  className="bk-stylist-dot"
                  style={{ background: stylist.color }}
                />
                <span className="kr">{stylist.short}</span>
              </div>
              <div className="bk-td-status">
                <span
                  className="bk-status-pill"
                  style={{
                    background: `color-mix(in oklab, ${st.color} 14%, transparent)`,
                    color: st.color,
                  }}
                >
                  <span
                    className="bk-status-dot"
                    style={{ background: st.color }}
                  />
                  <span className="kr">{st.kr}</span>
                </span>
              </div>
              <div className="bk-td-paid mono">
                {b.paid > 0 ? "₩" + b.paid.toLocaleString() : "—"}
              </div>
              <div className="bk-td-act">
                <button
                  className="bk-row-act"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(b);
                  }}
                >
                  ⋯
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────── TIMELINE VIEW ──────────────── */
function TimelineView({ onSelect, selectedId }) {
  const [bookings, setBookings] = useS(
    SEED_BOOKINGS.filter((b) => b.day === 2),
  );
  const [dragLane, setDragLane] = useS(null);

  return (
    <div className="bk-timeline">
      <div className="bk-tl-day-meta kr">
        2026.04.16 (수) · 오늘 · 12건 (외국인 8 / 국내 4)
      </div>
      <div className="bk-tl-grid">
        <div className="bk-tl-hour-row">
          <div className="bk-tl-lane-head" />
          {HOURS.map((h) => (
            <div key={h} className="bk-tl-hour mono">
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {STYLISTS.map((s) => (
          <div key={s.id} className="bk-tl-row">
            <div className="bk-tl-lane-head">
              <span
                className="bk-tl-lane-dot"
                style={{ background: s.color }}
              />
              <span className="kr-display">{s.name}</span>
              <span className="bk-tl-lane-meta mono">
                {bookings.filter((b) => b.stylist === s.id).length}
              </span>
            </div>
            <div className="bk-tl-track" data-stylist={s.id}>
              {HOURS.map((h, i) => (
                <div key={i} className="bk-tl-hour-cell" />
              ))}
              {bookings
                .filter((b) => b.stylist === s.id)
                .map((b) => (
                  <button
                    key={b.id}
                    className={
                      "bk-tl-block" +
                      (b.foreign ? " foreign" : " local") +
                      " status-" +
                      b.status +
                      (selectedId === b.id ? " selected" : "")
                    }
                    style={{
                      left: (b.start - 9) * (100 / HOURS.length) + "%",
                      width: (b.end - b.start) * (100 / HOURS.length) + "%",
                    }}
                    onClick={() => onSelect(b)}
                  >
                    {b.foreign && <span className="bk-tl-flag">{b.flag}</span>}
                    <span className="bk-tl-block-name kr">{b.kr}</span>
                    <span className="bk-tl-block-svc kr">{b.service}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
        <div
          className="bk-tl-now-line"
          style={{
            left: `calc(180px + ${(14 + 24 / 60 - 9) * (100 / HOURS.length)}%)`,
          }}
        >
          <span className="bk-tl-now-dot" />
          <span className="bk-tl-now-label kr mono">14:24 지금</span>
        </div>
      </div>
      <div className="bk-tl-hint kr">
        <span>💡</span>
        <span>예약 블록을 다른 디자이너 라인으로 끌어 재배정할 수 있어요.</span>
      </div>
    </div>
  );
}

window.HesyaBkConstants = { STYLISTS, stylistById, HOURS, DAYS, SEED_BOOKINGS };
window.HesyaBkParts = {
  TopHeader,
  Sidebar,
  HeaderStrip,
  WeekGrid,
  MonthGrid,
  ListView,
  TimelineView,
};
