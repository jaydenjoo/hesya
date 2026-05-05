/* global React */
const { useState: uS, useEffect: uE } = React;

const COUNTRIES = {
  jp: { flag: "🇯🇵", kr: "일본" },
  kr: { flag: "🇰🇷", kr: "한국" },
  cn: { flag: "🇨🇳", kr: "중국" },
  us: { flag: "🇺🇸", kr: "미국" },
  vn: { flag: "🇻🇳", kr: "베트남" },
  br: { flag: "🇧🇷", kr: "브라질" },
  fr: { flag: "🇫🇷", kr: "프랑스" },
  sg: { flag: "🇸🇬", kr: "싱가포르" },
};

const CUSTOMERS = [
  {
    id: 1,
    kr: "사쿠라",
    roman: "Sakura Sato",
    c: "jp",
    lang: "日本語",
    visits: 4,
    total: 680000,
    last: "2일 전",
    stylist: "민지",
    tags: ["퍼스널컬러", "VIP"],
    status: "vip",
    note: "@sakura.tokyo · Tokyo",
    upcoming: 3,
    allergy: true,
  },
  {
    id: 2,
    kr: "김지영",
    roman: "Kim Ji-young",
    c: "kr",
    lang: "한국어",
    visits: 12,
    total: 1240000,
    last: "오늘",
    stylist: "소연",
    tags: ["단골"],
    status: "active",
    note: "단골 · 강남구",
    upcoming: null,
  },
  {
    id: 3,
    kr: "Wei Chen",
    roman: "Wei Chen",
    c: "cn",
    lang: "中文",
    visits: 2,
    total: 150000,
    last: "5일 전",
    stylist: "민지",
    tags: ["보류"],
    status: "warn",
    note: "@weichen_bj · Beijing",
    upcoming: null,
  },
  {
    id: 4,
    kr: "Emma Park",
    roman: "Emma Park",
    c: "us",
    lang: "English",
    visits: 6,
    total: 980000,
    last: "1주 전",
    stylist: "현주",
    tags: ["브라이덜", "VIP"],
    status: "vip",
    note: "@emma.in.seoul · NYC",
    upcoming: 14,
    allergy: true,
  },
  {
    id: 5,
    kr: "박서윤",
    roman: "Park Seo-yoon",
    c: "kr",
    lang: "한국어",
    visits: 8,
    total: 360000,
    last: "2주 전",
    stylist: "소연",
    tags: ["헤어컷"],
    status: "active",
    note: "마포구 거주",
    upcoming: null,
  },
  {
    id: 6,
    kr: "Yuki Tanaka",
    roman: "Yuki Tanaka",
    c: "jp",
    lang: "日本語",
    visits: 3,
    total: 420000,
    last: "1달 전",
    stylist: "유진",
    tags: ["메이크업"],
    status: "active",
    note: "@yuki_osaka · Osaka",
    upcoming: null,
  },
  {
    id: 7,
    kr: "Linh Pham",
    roman: "Linh Pham",
    c: "vn",
    lang: "Tiếng Việt",
    visits: 1,
    total: 380000,
    last: "3일 전",
    stylist: "민지",
    tags: ["브라이덜"],
    status: "active",
    note: "@linh.hanoi · Hanoi",
    upcoming: 7,
  },
  {
    id: 8,
    kr: "Mei Zhang",
    roman: "Mei Zhang",
    c: "cn",
    lang: "中文",
    visits: 2,
    total: 80000,
    last: "75일 전",
    stylist: "소연",
    tags: [],
    status: "dormant",
    note: "@meimei.sh · Shanghai",
    upcoming: null,
  },
  {
    id: 9,
    kr: "Sakura Tanaka",
    roman: "Sakura Tanaka",
    c: "jp",
    lang: "日本語",
    visits: 5,
    total: 720000,
    last: "1일 전",
    stylist: "민지",
    tags: ["퍼스널컬러", "VIP"],
    status: "vip",
    note: "@sakura.t · Kyoto",
    upcoming: null,
    allergy: true,
  },
  {
    id: 10,
    kr: "이수진",
    roman: "Lee Su-jin",
    c: "kr",
    lang: "한국어",
    visits: 15,
    total: 580000,
    last: "오늘",
    stylist: "현주",
    tags: ["VIP", "단골"],
    status: "vip",
    note: "30대 · 회사원",
    upcoming: 21,
  },
  {
    id: 11,
    kr: "Ana Silva",
    roman: "Ana Silva",
    c: "br",
    lang: "Português",
    visits: 2,
    total: 180000,
    last: "10일 전",
    stylist: "유진",
    tags: [],
    status: "active",
    note: "@ana.sp · São Paulo",
    upcoming: null,
  },
  {
    id: 12,
    kr: "정유나",
    roman: "Jung Yu-na",
    c: "kr",
    lang: "한국어",
    visits: 22,
    total: 1880000,
    last: "3일 전",
    stylist: "현주",
    tags: ["VIP", "단골"],
    status: "vip",
    note: "5년 단골",
    upcoming: 5,
  },
  {
    id: 13,
    kr: "Hana Kim",
    roman: "Hana Kim",
    c: "us",
    lang: "English",
    visits: 3,
    total: 280000,
    last: "1주 전",
    stylist: "민지",
    tags: ["메이크업"],
    status: "active",
    note: "@hana.la · Los Angeles",
    upcoming: null,
  },
  {
    id: 14,
    kr: "Wei Liu",
    roman: "Wei Liu",
    c: "cn",
    lang: "中文",
    visits: 4,
    total: 620000,
    last: "2주 전",
    stylist: "유진",
    tags: ["퍼스널컬러"],
    status: "active",
    note: "@weiliu_gz · Guangzhou",
    upcoming: null,
  },
  {
    id: 15,
    kr: "Camille Dupont",
    roman: "Camille Dupont",
    c: "fr",
    lang: "Français",
    visits: 1,
    total: 90000,
    last: "120일 전",
    stylist: "소연",
    tags: [],
    status: "dormant",
    note: "@camille.paris · Paris",
    upcoming: null,
  },
  {
    id: 16,
    kr: "최수민",
    roman: "Choi Su-min",
    c: "kr",
    lang: "한국어",
    visits: 9,
    total: 980000,
    last: "5일 전",
    stylist: "소연",
    tags: ["펌"],
    status: "active",
    note: "신혼",
    upcoming: null,
  },
  {
    id: 17,
    kr: "Aiko Nakamura",
    roman: "Aiko Nakamura",
    c: "jp",
    lang: "日本語",
    visits: 2,
    total: 230000,
    last: "2주 전",
    stylist: "민지",
    tags: ["메이크업"],
    status: "active",
    note: "@aiko.tokyo · Tokyo",
    upcoming: null,
  },
  {
    id: 18,
    kr: "Chen Lihua",
    roman: "Chen Lihua",
    c: "sg",
    lang: "中文",
    visits: 3,
    total: 540000,
    last: "3주 전",
    stylist: "유진",
    tags: ["VIP"],
    status: "vip",
    note: "@lihua.sg · Singapore",
    upcoming: null,
  },
];

const STATUS_MAP = {
  active: { kr: "활성", icon: "●", color: "var(--semantic-success)" },
  vip: { kr: "VIP", icon: "★", color: "var(--hesya-amber-500)" },
  dormant: { kr: "휴면", icon: "○", color: "var(--gray-500)" },
  warn: { kr: "주의", icon: "⚠", color: "var(--semantic-danger)" },
};

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

function NavSidebar() {
  const items = [
    { icon: "▦", label: "Dashboard" },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings" },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers", active: true },
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

function Header({ onSegment }) {
  return (
    <div className="cu-header">
      <div className="cu-header-l">
        <h1 className="cu-title kr-display">고객</h1>
        <span className="cu-meta kr">
          <strong className="mono">1,284</strong>명{" "}
          <span className="cu-meta-sep">·</span> 이번 달{" "}
          <strong className="mono cu-up">+47</strong>
        </span>
      </div>
      <div className="cu-header-r">
        <button className="cu-export-btn kr">내보내기 ↓</button>
        <button className="cu-segment-btn kr" onClick={onSegment}>
          <span style={{ fontSize: 14 }}>+</span>
          <span>세그먼트</span>
        </button>
      </div>
    </div>
  );
}

function FilterRow({ filter, setFilter, q, setQ }) {
  const filters = [
    { id: "all", kr: "전체", n: 1284 },
    { id: "foreign", kr: "외국인만", n: 612 },
    { id: "vip", kr: "VIP", n: 28 },
  ];
  return (
    <div className="cu-filters">
      <div className="cu-filter-pills">
        {filters.map((f) => (
          <button
            key={f.id}
            className={"cu-fp" + (filter === f.id ? " active" : "")}
            onClick={() => setFilter(f.id)}
          >
            <span className="kr">{f.kr}</span>
            <span className="cu-fp-n mono">{f.n}</span>
          </button>
        ))}
        <button className="cu-fp dropdown kr">
          재방문 <span>▾</span>
        </button>
        <button className="cu-fp dropdown kr">
          국가 <span>▾</span>
        </button>
        <button className="cu-fp dropdown kr">
          언어 <span>▾</span>
        </button>
      </div>
      <div className="cu-filter-r">
        <div className="cu-search">
          <span>⌕</span>
          <input
            placeholder="이름·전화·@핸들로 검색…"
            className="kr"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd>⌘F</kbd>
        </div>
      </div>
    </div>
  );
}

function CustomerRow({ c, selected, onClick, dense }) {
  const country = COUNTRIES[c.c];
  const status = STATUS_MAP[c.status];
  return (
    <div
      className={
        "cu-tr" + (selected ? " selected" : "") + (dense ? " dense" : "")
      }
      onClick={() => onClick(c)}
    >
      <div className="cu-td-check">
        <input type="checkbox" onClick={(e) => e.stopPropagation()} />
      </div>
      <div className="cu-td-name">
        <div className="cu-avatar-wrap">
          <div
            className="cu-avatar"
            style={{
              background:
                c.id % 3 === 0
                  ? "var(--hesya-peach-200)"
                  : c.id % 3 === 1
                    ? "var(--hesya-amber-500)"
                    : "var(--hesya-navy-900)",
              color:
                c.id % 3 === 1
                  ? "#FFF"
                  : c.id % 3 === 2
                    ? "#FFF"
                    : "var(--hesya-navy-900)",
            }}
          >
            {c.kr.charAt(0)}
          </div>
          <span className="cu-avatar-flag">{country.flag}</span>
        </div>
        <div className="cu-name-text">
          <div className="cu-name-row">
            <span className="kr-display cu-name-kr">{c.kr}</span>
            {c.kr !== c.roman && (
              <span className="cu-name-roman">({c.roman})</span>
            )}
            {c.allergy && (
              <span className="cu-allergy-mark" title="알레르기 있음">
                ⚠
              </span>
            )}
          </div>
          <div className="cu-name-sub">{c.note}</div>
        </div>
      </div>
      <div className="cu-td-country kr">
        <span className="cu-flag-sm">{country.flag}</span>
        <span>{country.kr}</span>
      </div>
      <div className="cu-td-lang">{c.lang}</div>
      <div className="cu-td-visits mono">{c.visits}</div>
      <div className="cu-td-total mono">₩{(c.total / 1000).toFixed(0)}K</div>
      <div className="cu-td-last kr">{c.last}</div>
      <div className="cu-td-stylist">
        <span className="cu-stylist-dot" />
        <span className="kr">{c.stylist}</span>
      </div>
      <div className="cu-td-tags">
        {c.tags.slice(0, 2).map((t, i) => (
          <span key={i} className={"cu-tag-mini" + (t === "VIP" ? " vip" : "")}>
            {t}
          </span>
        ))}
        {c.tags.length > 2 && (
          <span className="cu-tag-more">+{c.tags.length - 2}</span>
        )}
      </div>
      <div className="cu-td-status">
        <span className={"cu-status-pill " + c.status}>
          <span className="cu-status-icon">{status.icon}</span>
          <span className="kr">{status.kr}</span>
        </span>
      </div>
      <div className="cu-td-act">
        <button
          className="cu-row-act"
          onClick={(e) => {
            e.stopPropagation();
            onClick(c);
          }}
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

function DataTable({ selected, onSelect, q }) {
  const [dense, setDense] = uS(false);
  const filtered = CUSTOMERS.filter(
    (c) =>
      !q ||
      c.kr.toLowerCase().includes(q.toLowerCase()) ||
      c.roman.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="cu-table-wrap">
      <div className="cu-table-toolbar">
        <span className="kr cu-table-count">
          {filtered.length}명 표시 · 외국인{" "}
          {filtered.filter((c) => c.c !== "kr").length}명
        </span>
        <div className="cu-table-toolbar-r">
          <button className="cu-sort-btn kr">최근 방문 ▾</button>
          <button
            className={"cu-density-toggle" + (dense ? " active" : "")}
            onClick={() => setDense(!dense)}
          >
            <span className="kr">{dense ? "조밀" : "기본"}</span>
          </button>
        </div>
      </div>
      <div className={"cu-table" + (dense ? " dense" : "")}>
        <div className="cu-tr cu-th">
          <div className="cu-td-check"></div>
          <div className="cu-td-name kr">이름</div>
          <div className="cu-td-country kr">국가</div>
          <div className="cu-td-lang kr">언어</div>
          <div className="cu-td-visits kr">방문</div>
          <div className="cu-td-total kr">총 결제</div>
          <div className="cu-td-last kr">최근</div>
          <div className="cu-td-stylist kr">선호 디자이너</div>
          <div className="cu-td-tags kr">태그</div>
          <div className="cu-td-status kr">상태</div>
          <div className="cu-td-act"></div>
        </div>
        {filtered.map((c) => (
          <CustomerRow
            key={c.id}
            c={c}
            selected={selected?.id === c.id}
            onClick={onSelect}
            dense={dense}
          />
        ))}
      </div>
    </div>
  );
}

window.HesyaCuParts1 = {
  TopHeader,
  NavSidebar,
  Header,
  FilterRow,
  DataTable,
  CUSTOMERS,
  COUNTRIES,
  STATUS_MAP,
};
