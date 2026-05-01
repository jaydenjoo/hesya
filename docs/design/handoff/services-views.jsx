/* global React */
const { useState: useSv, useEffect: useEv, useRef: useRv } = React;

/* Re-use header + sidebar from dashboard.css */
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
    { icon: "✂", label: "Services", active: true },
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

const CATEGORIES = [
  { id: "cut", icon: "✂", kr: "헤어컷", en: "Hair Cut", count: 12 },
  { id: "color", icon: "◐", kr: "컬러", en: "Color", count: 8 },
  { id: "treat", icon: "✿", kr: "트리트먼트", en: "Treatment", count: 6 },
  { id: "nail", icon: "❀", kr: "네일", en: "Nail", count: 4 },
  { id: "makeup", icon: "✦", kr: "메이크업", en: "Makeup", count: 2 },
];

const LANGS = [
  { id: "ko", label: "한국어", flag: "🇰🇷", source: true },
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "ja", label: "日本語", flag: "🇯🇵" },
  { id: "zhCN", label: "中文(简)", flag: "🇨🇳" },
  { id: "zhTW", label: "中文(繁)", flag: "🇹🇼" },
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

const SERVICES = [
  {
    id: 1,
    kr: "K-Beauty 메이크업 풀세트",
    en: "Full K-Beauty Makeup",
    duration: 90,
    price: 280000,
    img: "linear-gradient(135deg, #F5DDC8 0%, #E0B996 100%)",
    icon: "💄",
    langs: {
      ko: "ok",
      en: "ok",
      ja: "ai",
      zhCN: "ok",
      zhTW: "none",
      vi: "none",
    },
    status: "published",
  },
  {
    id: 2,
    kr: "디지털 펌 + 컷",
    en: "Digital Perm + Cut",
    duration: 180,
    price: 220000,
    img: "linear-gradient(135deg, #FDF8F1 0%, #F5DDC8 100%)",
    icon: "✂",
    langs: {
      ko: "ok",
      en: "ok",
      ja: "ok",
      zhCN: "ai",
      zhTW: "none",
      vi: "none",
    },
    status: "published",
  },
  {
    id: 3,
    kr: "퍼스널컬러 진단",
    en: "Personal Color Analysis",
    duration: 60,
    price: 90000,
    img: "linear-gradient(135deg, #E8A117 0%, #C68B5C 100%)",
    icon: "◐",
    langs: { ko: "ok", en: "ok", ja: "ok", zhCN: "ok", zhTW: "ok", vi: "ai" },
    status: "published",
  },
  {
    id: 4,
    kr: "두피 케어 (스칼프)",
    en: "Scalp Care",
    duration: 45,
    price: 65000,
    img: "linear-gradient(135deg, #F5DDC8 0%, #C68B5C 100%)",
    icon: "✿",
    langs: {
      ko: "ok",
      en: "ai",
      ja: "none",
      zhCN: "none",
      zhTW: "none",
      vi: "none",
    },
    status: "draft",
  },
  {
    id: 5,
    kr: "헤어 글로스 (반영구 컬러)",
    en: "Hair Gloss",
    duration: 90,
    price: 140000,
    img: "linear-gradient(135deg, #1A2238 0%, #C68B5C 100%)",
    icon: "◐",
    langs: {
      ko: "ok",
      en: "ok",
      ja: "ai",
      zhCN: "ai",
      zhTW: "none",
      vi: "none",
    },
    status: "published",
  },
  {
    id: 6,
    kr: "브라이덜 메이크업",
    en: "Bridal Makeup",
    duration: 120,
    price: 380000,
    img: "linear-gradient(135deg, #F5DDC8 0%, #E8A117 100%)",
    icon: "✦",
    langs: { ko: "ok", en: "ok", ja: "ok", zhCN: "ok", zhTW: "ai", vi: "ai" },
    status: "published",
    featured: true,
  },
];

function Header({ onAIBatch }) {
  return (
    <div className="sv-header">
      <div className="sv-header-l">
        <h1 className="sv-title kr-display">시술 메뉴</h1>
        <span className="sv-meta kr">
          총 <strong>32개</strong> 시술 · <strong>5개</strong> 카테고리
        </span>
        <span className="sv-meta-divider" />
        <span className="sv-lang-summary">
          <span className="kr">번역률</span>
          <span className="sv-progress">
            <span className="sv-progress-fill" style={{ width: "78%" }} />
          </span>
          <span className="mono">78%</span>
        </span>
      </div>
      <div className="sv-header-r">
        <button className="sv-btn-ghost kr" onClick={onAIBatch}>
          <span className="sv-sparkle">✨</span>
          <span>AI 자동 번역 일괄 적용</span>
          <span className="sv-pending-count mono">4</span>
        </button>
        <button className="sv-btn-primary kr">
          <span style={{ fontSize: 15 }}>+</span>
          <span>새 시술</span>
        </button>
      </div>
    </div>
  );
}

function CategorySidebar({ active, setActive }) {
  return (
    <aside className="sv-cat">
      <div className="sv-cat-head">
        <span className="sv-cat-eyebrow kr">카테고리</span>
        <button className="sv-cat-sort">⋮⋮</button>
      </div>
      <ul className="sv-cat-list">
        {CATEGORIES.map((c) => (
          <li
            key={c.id}
            className={"sv-cat-item" + (active === c.id ? " active" : "")}
            onClick={() => setActive(c.id)}
          >
            <span className="sv-cat-handle">⋮⋮</span>
            <span className="sv-cat-icon">{c.icon}</span>
            <div className="sv-cat-text">
              <span className="kr-display sv-cat-kr">{c.kr}</span>
              <span className="sv-cat-en">{c.en}</span>
            </div>
            <span className="sv-cat-count mono">{c.count}</span>
          </li>
        ))}
        <li className="sv-cat-add">
          <span style={{ fontSize: 14 }}>+</span>
          <span className="kr">카테고리 추가</span>
        </li>
      </ul>
      <div className="sv-cat-footer">
        <div className="sv-cat-tip kr">
          <span className="sv-cat-tip-icon">💡</span>
          <span>드래그해서 순서를 바꾸면 손님 페이지에도 반영돼요.</span>
        </div>
      </div>
    </aside>
  );
}

function LangPill({ id, status }) {
  const map = {
    ok: { cls: "ok", icon: "✓" },
    ai: { cls: "ai", icon: "⚠" },
    none: { cls: "none", icon: "—" },
  };
  const m = map[status];
  return (
    <span
      className={"sv-lang-pill " + m.cls}
      title={
        status === "ai"
          ? "자동번역, 검수 필요"
          : status === "none"
            ? "미번역"
            : "확인 완료"
      }
    >
      <span className="sv-lang-pill-icon">{m.icon}</span>
      <span className="sv-lang-pill-id">{id}</span>
    </span>
  );
}

function ServiceCard({ svc, onEdit }) {
  const aiCount = Object.values(svc.langs).filter((s) => s === "ai").length;
  return (
    <article
      className={"sv-card" + (svc.status === "draft" ? " is-draft" : "")}
    >
      <div className="sv-card-photo" style={{ backgroundImage: svc.img }}>
        <span className="sv-card-photo-icon">{svc.icon}</span>
        {svc.featured && <span className="sv-card-feat kr">★ 인기</span>}
        {svc.status === "draft" && (
          <span className="sv-card-draft kr">초안</span>
        )}
        <button
          className="sv-photo-change kr"
          onClick={(e) => e.stopPropagation()}
        >
          <span>📷</span>
          <span>사진 변경</span>
        </button>
      </div>
      <div className="sv-card-body">
        <h3 className="sv-card-name kr-display">{svc.kr}</h3>
        <div className="sv-card-en">{svc.en}</div>
        <div className="sv-card-meta">
          <span className="sv-card-dur kr">{svc.duration}분</span>
          <span className="sv-meta-dot" />
          <span className="sv-card-price mono">
            ₩{svc.price.toLocaleString()}
          </span>
        </div>
        <div className="sv-card-langs">
          {LANGS.map((l) => (
            <LangPill
              key={l.id}
              id={l.id === "zhCN" ? "zh" : l.id === "zhTW" ? "zh-繁" : l.id}
              status={svc.langs[l.id]}
            />
          ))}
          {aiCount > 0 && (
            <span className="sv-card-ai-warn kr">
              <span>⚠</span>
              <span>{aiCount}개 검수 필요</span>
            </span>
          )}
        </div>
        <div className="sv-card-foot">
          <button className="sv-card-edit kr" onClick={() => onEdit(svc)}>
            편집 →
          </button>
          <button className="sv-card-menu" aria-label="더보기">
            ⋯
          </button>
        </div>
      </div>
    </article>
  );
}

function CardGrid({ onEdit }) {
  return (
    <div className="sv-grid">
      {SERVICES.map((s) => (
        <ServiceCard key={s.id} svc={s} onEdit={onEdit} />
      ))}
    </div>
  );
}

function EmptyCategory() {
  return (
    <div className="sv-empty">
      <svg className="sv-empty-svg" viewBox="0 0 220 160" fill="none">
        <rect
          x="40"
          y="50"
          width="140"
          height="86"
          rx="8"
          fill="#FDF8F1"
          stroke="#1A2238"
          strokeWidth="1.5"
        />
        <line
          x1="58"
          y1="72"
          x2="120"
          y2="72"
          stroke="#E0B996"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="86"
          x2="148"
          y2="86"
          stroke="#E0B996"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="58"
          y1="100"
          x2="100"
          y2="100"
          stroke="#E0B996"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="160"
          cy="48"
          r="14"
          fill="#F5DDC8"
          stroke="#1A2238"
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="52"
          textAnchor="middle"
          fontSize="14"
          fill="#1A2238"
          fontWeight="700"
        >
          +
        </text>
        <path
          d="M180 130 L185 138 L193 142 L185 146 L180 154 L175 146 L167 142 L175 138 Z"
          fill="#E8A117"
          opacity="0.5"
        />
      </svg>
      <h3 className="sv-empty-title kr-display">이 카테고리에 시술이 없어요</h3>
      <p className="sv-empty-body kr">
        첫 시술을 추가하면 즉시 손님 페이지에 노출됩니다.
      </p>
      <button className="sv-empty-btn kr">+ 첫 시술 추가하기</button>
    </div>
  );
}

window.HesyaSvParts = {
  TopHeader,
  NavSidebar,
  Header,
  CategorySidebar,
  CardGrid,
  ServiceCard,
  EmptyCategory,
  LANGS,
  CATEGORIES,
  SERVICES,
};
