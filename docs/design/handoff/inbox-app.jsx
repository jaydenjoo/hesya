/* global React */
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ──────────────── Top header (reused from dashboard) ──────────────── */
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
    { icon: "✉", label: "Inbox", badge: 12, active: true },
    { icon: "▥", label: "Bookings" },
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

/* ──────────────── COL 1 — Channel rail ──────────────── */
const THREADS = [
  {
    id: 1,
    name: "佐藤さくら",
    kr: "사쿠라",
    flag: "🇯🇵",
    channel: "📱",
    lang: "日本語",
    preview: "明日午後3時に予約変更できますか？",
    krPreview: "내일 오후 3시로 예약 변경 가능할까요?",
    time: "14:24",
    unread: 2,
    ai: true,
    vip: false,
    online: true,
    current: true,
  },
  {
    id: 2,
    name: "Wei Chen",
    kr: "웨이 첸",
    flag: "🇨🇳",
    channel: "💬",
    lang: "中文",
    preview: "想预约K-Beauty全套 周六下午",
    krPreview: "K-Beauty 풀세트 토요일 오후 예약하고 싶어요",
    time: "13:58",
    unread: 3,
    ai: false,
    vip: true,
  },
  {
    id: 3,
    name: "Emma Kim",
    kr: "엠마 김",
    flag: "🇺🇸",
    channel: "📱",
    lang: "English",
    preview: "Could I get a refund for yesterday's service?",
    krPreview: "어제 시술 환불 받을 수 있을까요?",
    time: "12:30",
    unread: 1,
    ai: false,
    vip: false,
    urgent: true,
  },
  {
    id: 4,
    name: "Yuki Tanaka",
    kr: "유키 다나카",
    flag: "🇯🇵",
    channel: "💚",
    lang: "日本語",
    preview: "友達3人と一緒に行きたいです",
    krPreview: "친구 3명과 함께 가고 싶어요",
    time: "11:42",
    unread: 1,
    ai: true,
  },
  {
    id: 5,
    name: "Linh Pham",
    kr: "린 팜",
    flag: "🇻🇳",
    channel: "📲",
    lang: "Tiếng Việt",
    preview: "Cảm ơn rất nhiều — mọi người rất thân thiện!",
    krPreview: "정말 감사합니다 — 모두 친절했어요!",
    time: "10:15",
    unread: 0,
    ai: false,
    complete: true,
  },
  {
    id: 6,
    name: "Mei Zhang",
    kr: "메이 장",
    flag: "🇨🇳",
    channel: "📱",
    lang: "中文",
    preview: "婚礼试妆什么时候开始？",
    krPreview: "브라이덜 트라이얼 언제 시작하나요?",
    time: "어제",
    unread: 0,
    ai: false,
    complete: true,
  },
  {
    id: 7,
    name: "Ana Silva",
    kr: "아나 실바",
    flag: "🇧🇷",
    channel: "📲",
    lang: "Português",
    preview: "Posso pagar em USD?",
    krPreview: "USD로 결제 가능한가요?",
    time: "어제",
    unread: 0,
    ai: true,
    complete: true,
  },
  {
    id: 8,
    name: "Hana Choi",
    kr: "하나 최",
    flag: "🇰🇷",
    channel: "💬",
    lang: "한국어",
    preview: "일요일 11시 예약 부탁드립니다",
    krPreview: "",
    time: "어제",
    unread: 0,
    ai: false,
    complete: true,
    native: true,
  },
];

function ChannelRail({
  activeChannel,
  setActiveChannel,
  activeFilter,
  setActiveFilter,
  currentId,
  setCurrentId,
}) {
  const channels = [
    { id: "all", icon: "●", label: "All", n: 12 },
    { id: "ig", icon: "📱", label: "IG", n: 5 },
    { id: "kt", icon: "💬", label: "KT", n: 4 },
    { id: "wa", icon: "📲", label: "WA", n: 2 },
    { id: "line", icon: "💚", label: "LINE", n: 1 },
    { id: "fb", icon: "📘", label: "FB", n: 0 },
  ];
  const filters = [
    {
      id: "unread",
      icon: "●",
      label: "미답",
      n: 9,
      dot: "var(--semantic-danger)",
    },
    {
      id: "ai",
      icon: "●",
      label: "AI 대기",
      n: 2,
      dot: "var(--semantic-warning)",
    },
    {
      id: "done",
      icon: "●",
      label: "완료",
      n: 23,
      dot: "var(--semantic-success)",
    },
    { id: "vip", icon: "★", label: "VIP", n: null },
  ];
  return (
    <div className="ix-col-1">
      <div className="ix-col-head">
        <h2 className="kr-display">통합 인박스</h2>
        <span className="ix-total mono">12 미답</span>
      </div>

      <div className="ix-channel-row">
        {channels.map((c) => (
          <button
            key={c.id}
            className={
              "ix-channel-chip" + (activeChannel === c.id ? " active" : "")
            }
            onClick={() => setActiveChannel(c.id)}
          >
            <span className="ix-ch-icon">{c.icon}</span>
            <span className="ix-ch-label">{c.label}</span>
            {c.n > 0 && <span className="ix-ch-num">{c.n}</span>}
          </button>
        ))}
      </div>

      <div className="ix-filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            className={
              "ix-filter-pill" + (activeFilter === f.id ? " active" : "")
            }
            onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
          >
            {f.dot ? (
              <span className="ix-filter-dot" style={{ background: f.dot }} />
            ) : (
              <span className="ix-filter-emo">{f.icon}</span>
            )}
            <span className="kr">{f.label}</span>
            {f.n != null && <span className="ix-filter-n">{f.n}</span>}
          </button>
        ))}
      </div>

      <div className="ix-search">
        <span>⌕</span>
        <input placeholder="이름, 메시지 검색…" />
        <kbd className="sd-kbd">⌘F</kbd>
      </div>

      <div className="ix-thread-list">
        {THREADS.map((t) => (
          <button
            key={t.id}
            className={
              "ix-thread-row" +
              (t.unread > 0 ? " unread" : "") +
              (currentId === t.id ? " current" : "") +
              (t.urgent ? " urgent" : "")
            }
            onClick={() => setCurrentId(t.id)}
          >
            <div className="ix-avatar-wrap">
              <div
                className="ix-avatar"
                style={{
                  background: [
                    "#F5DDC8",
                    "#F8E9D9",
                    "#FDF8F1",
                    "#E8C4D6",
                    "#F5DDC8",
                    "#F8E9D9",
                    "#FDF8F1",
                    "#F5DDC8",
                  ][t.id % 8],
                }}
              >
                {t.kr ? t.kr.charAt(0) : t.name.charAt(0)}
              </div>
              <div className="ix-avatar-channel">{t.channel}</div>
            </div>
            <div className="ix-thread-body">
              <div className="ix-thread-line-1">
                <span className="ix-thread-name kr">{t.kr || t.name}</span>
                <span className="ix-thread-flag">{t.flag}</span>
                {t.vip && <span className="ix-vip-star">⭐</span>}
                <span className="ix-thread-time mono">{t.time}</span>
              </div>
              <div className="ix-thread-preview">
                <span className="ix-preview-orig">{t.preview}</span>
              </div>
              {t.krPreview && (
                <div className="ix-preview-kr kr">{t.krPreview}</div>
              )}
              <div className="ix-thread-foot">
                {t.ai && <span className="ix-ai-tag kr">🤖 AI 대기</span>}
                {t.urgent && <span className="ix-urgent-tag kr">환불</span>}
                {t.complete && <span className="ix-done-tag kr">✓</span>}
                {t.unread > 0 && (
                  <span className="ix-unread-badge mono">{t.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── COL 2 — Thread ──────────────── */
const SAKURA_MSGS = [
  {
    from: "customer",
    time: "14:18",
    orig: "こんにちは！明日の予約のことで相談したいです。",
    kr: "안녕하세요! 내일 예약 건으로 상담드리고 싶어요.",
    confidence: "high",
  },
  {
    from: "owner",
    time: "14:20",
    krOrig: "안녕하세요 사쿠라님! 무엇을 도와드릴까요?",
    trans: "こんにちは、さくら様！どのようなご相談でしょうか?",
    confidence: "high",
  },
  {
    from: "customer",
    time: "14:22",
    orig: "明日午後3時に予約変更できますか？K-Beautyメイクアップでお願いしたいです。",
    kr: "내일 오후 3시로 예약 변경 가능할까요? K-Beauty 메이크업으로 부탁드립니다.",
    confidence: "high",
  },
  {
    from: "customer",
    time: "14:23",
    orig: "あと、英語が話せるスタイリストはいますか？",
    kr: "그리고 영어 가능한 스타일리스트가 있나요?",
    confidence: "medium",
  },
];

function ThreadHeader({ thread }) {
  return (
    <div className="ix-thread-head">
      <div className="ix-th-avatar" style={{ background: "#F5DDC8" }}>
        {thread.kr.charAt(0)}
      </div>
      <div className="ix-th-body">
        <div className="ix-th-name-row">
          <span className="kr-display">{thread.kr}</span>
          <span className="ix-th-flag">{thread.flag}</span>
          <span className="ix-th-channel">{thread.channel}</span>
        </div>
        <div className="ix-th-meta">
          <span className="ix-online">
            <span className="dot" />
            <span className="kr">온라인</span>
          </span>
          <span className="ix-th-sep">·</span>
          <span className="kr">Instagram DM</span>
          <span className="ix-th-sep">·</span>
          <span>{thread.lang}</span>
        </div>
      </div>
      <div className="ix-th-actions">
        <button className="ix-th-btn">
          <span>✓</span>
          <span className="kr">처리 완료</span>
        </button>
        <button className="ix-th-btn">
          <span>⭐</span>
          <span className="kr">VIP</span>
        </button>
        <button className="ix-th-btn icon-only" aria-label="More">
          ⋯
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ m }) {
  const [expanded, setExpanded] = useS(false);
  const isOwner = m.from === "owner";
  const conf =
    m.confidence === "high"
      ? { label: "신뢰도 높음", color: "var(--semantic-success)" }
      : {
          label: "약간 모호 — 원문 확인 권장",
          color: "var(--semantic-warning)",
        };

  return (
    <div className={"ix-msg" + (isOwner ? " owner" : " customer")}>
      <div className="ix-bubble">
        <div className="ix-bubble-orig">{isOwner ? m.krOrig : m.orig}</div>
        <div className="ix-bubble-trans kr">
          <span className="ix-globe">🌐</span>
          {isOwner ? m.trans : m.kr}
        </div>
        {expanded && (
          <div className="ix-bubble-audit">
            <div className="ix-audit-row">
              <span className="ix-audit-key kr">감지 언어</span>
              <span>{isOwner ? "한국어" : "日本語"}</span>
            </div>
            <div className="ix-audit-row">
              <span className="ix-audit-key kr">번역 신뢰도</span>
              <span style={{ color: conf.color }}>{conf.label}</span>
            </div>
            <div className="ix-audit-row">
              <span className="ix-audit-key kr">원문 보기</span>
              <span className="ix-audit-orig">
                {isOwner ? m.krOrig : m.orig}
              </span>
            </div>
          </div>
        )}
        <button
          className="ix-bubble-more kr"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "닫기" : "원문 / 신뢰도 보기"}
        </button>
      </div>
      <div className="ix-msg-time mono">{m.time}</div>
    </div>
  );
}

function MessageStream() {
  return (
    <div className="ix-stream">
      <div className="ix-day-mark">
        <span className="kr">오늘</span>
      </div>
      {SAKURA_MSGS.map((m, i) => (
        <MessageBubble key={i} m={m} />
      ))}
    </div>
  );
}

/* ──────────────── AI Assist Bar with tone verification ──────────────── */
function AIAssist() {
  const [tone, setTone] = useS("warm"); // warm | formal | friendly | short
  const [showWhy, setShowWhy] = useS(false);

  const drafts = {
    warm: {
      text: "사쿠라님, 안녕하세요! 내일 오후 3시로 예약 변경 도와드릴게요. K-Beauty 메이크업은 김민지 디자이너가 영어로 응대해드릴 수 있어요. 편하게 오세요 :)",
      verify: { state: "ok", label: "따뜻한 톤 유지", reason: null },
    },
    formal: {
      text: "안녕하세요. 내일 오후 3시로 예약 변경이 가능합니다. K-Beauty 메이크업은 김민지 디자이너가 영어로 응대 가능합니다.",
      verify: {
        state: "warn",
        label: "약간 사무적인 톤",
        reason:
          "원본 매장 톤은 '~해드려요'를 자주 사용하지만 이 초안은 '~합니다'로 작성되었어요.",
      },
    },
    friendly: {
      text: "사쿠라님~! 내일 3시 예약 OK예요 ✨ 김민지쌤이 영어로 도와드릴 거예요! 내일 봬요!",
      verify: {
        state: "warn",
        label: "매장 톤과 다소 차이",
        reason:
          "매장 평소 톤보다 캐주얼해요 — 이모지/'쌤' 표현은 평소 사용 빈도가 낮습니다.",
      },
    },
    short: {
      text: "네, 내일 15:00 가능합니다. 김민지 디자이너 영어 응대 가능.",
      verify: {
        state: "warn",
        label: "약간 사무적인 톤",
        reason: "간결하지만 환영 인사가 빠져 있어요.",
      },
    },
  };
  const draft = drafts[tone];

  const verifyClass = draft.verify.state === "ok" ? "ok" : "warn";
  const verifyIcon = draft.verify.state === "ok" ? "✓" : "⚠";

  return (
    <div className="ix-assist">
      <div className="ix-assist-head">
        <span className="ix-assist-eyebrow kr">🤖 AI가 답변을 준비했어요</span>
        <span className={"ix-tone-pill " + verifyClass}>
          <span className="ix-tone-icon">{verifyIcon}</span>
          <span className="kr">{draft.verify.label}</span>
          {draft.verify.reason && (
            <span className="ix-tone-why-wrap">
              <button
                className="ix-tone-why kr"
                onClick={() => setShowWhy(!showWhy)}
              >
                이유 보기
              </button>
              {showWhy && (
                <span className="ix-tone-pop kr">{draft.verify.reason}</span>
              )}
            </span>
          )}
        </span>
      </div>

      <div className="ix-assist-draft kr-display">{draft.text}</div>

      <div className="ix-tone-tabs">
        {[
          { id: "warm", label: "따뜻하게" },
          { id: "formal", label: "공식적으로" },
          { id: "short", label: "짧게" },
          { id: "friendly", label: "매장 톤으로", sparkle: true },
        ].map((t) => (
          <button
            key={t.id}
            className={"ix-tone-tab" + (tone === t.id ? " active" : "")}
            onClick={() => {
              setTone(t.id);
              setShowWhy(false);
            }}
          >
            <span className="kr">{t.label}</span>
            {t.sparkle && <span className="ix-tone-spark">✨</span>}
          </button>
        ))}
      </div>

      <div className="ix-assist-actions">
        <button className="ix-btn-peach kr">그대로 보내기</button>
        <button className="ix-btn-amber kr">편집 후 보내기 →</button>
        <button className="ix-btn-ghost kr">거절하고 직접 작성</button>
      </div>
    </div>
  );
}

/* ──────────────── Composer ──────────────── */
function Composer() {
  const [text, setText] = useS("");
  return (
    <div className="ix-composer">
      <div className="ix-comp-toolbar">
        <button className="ix-comp-tool" title="Photo">
          📷
        </button>
        <button className="ix-comp-tool" title="Voice">
          🎙️
        </button>
        <button className="ix-comp-tool" title="Attach">
          📎
        </button>
        <button className="ix-comp-tool" title="Templates">
          💡
        </button>
        <span className="ix-comp-divider" />
        <span className="ix-comp-shortcuts">
          <span className="kr">단축키</span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <kbd key={n} className="sd-kbd">
              {n}
            </kbd>
          ))}
        </span>
        <span className="ix-comp-spacer" />
        <button className="ix-store-tone kr">🎙️ 내 매장 톤 학습 →</button>
      </div>
      <div className="ix-comp-input-wrap">
        <textarea
          className="ix-comp-input kr"
          placeholder="한국어로 입력하면 자동 번역됩니다 → Type in Korean — we'll translate to customer's language"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className={"ix-send-btn" + (text.length > 0 ? " active" : "")}>
          <span className="kr">보내기</span>
          <span className="ix-send-kbd">
            <kbd>⌘</kbd>
            <kbd>↵</kbd>
          </span>
        </button>
      </div>
    </div>
  );
}

function ThreadCol({ thread }) {
  return (
    <div className="ix-col-2">
      <ThreadHeader thread={thread} />
      <MessageStream />
      <AIAssist />
      <Composer />
    </div>
  );
}

/* ──────────────── COL 3 — Customer context ──────────────── */
function ContextPanel({ thread }) {
  const [tab, setTab] = useS("info");
  return (
    <div className="ix-col-3">
      <div className="ix-ctx-head">
        <div className="ix-ctx-avatar" style={{ background: "#F5DDC8" }}>
          {thread.kr.charAt(0)}
        </div>
        <div className="ix-ctx-name kr-display">{thread.kr}</div>
        <div className="ix-ctx-native">
          <span>佐藤さくら</span>
          <span className="ix-ctx-rom">/ Sato Sakura</span>
        </div>
        <div className="ix-ctx-flagrow">
          <span>🇯🇵</span>
          <span className="kr">일본 도쿄</span>
          <span className="ix-ctx-sep">·</span>
          <span>32세</span>
        </div>
      </div>

      <div className="ix-ctx-tabs">
        {[
          { id: "info", label: "Info" },
          { id: "history", label: "History" },
          { id: "notes", label: "Notes" },
          { id: "risk", label: "Risk" },
        ].map((t) => (
          <button
            key={t.id}
            className={"ix-ctx-tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "risk" && <span className="ix-ctx-tab-pip" />}
          </button>
        ))}
      </div>

      <div className="ix-ctx-body">
        {tab === "info" && (
          <div className="ix-ctx-info">
            <div className="ix-ctx-block">
              <div className="ix-ctx-key kr">언어</div>
              <div className="ix-ctx-val">日本語 · English (intermediate)</div>
            </div>
            <div className="ix-ctx-block">
              <div className="ix-ctx-key kr">Instagram</div>
              <div className="ix-ctx-val">@sakura_in_seoul · 4.2K</div>
            </div>
            <div className="ix-ctx-block highlight">
              <div className="ix-ctx-key kr">총 사용 금액</div>
              <div className="ix-ctx-val mono">₩280,000</div>
              <div className="ix-ctx-sub kr">2회 방문 · 객단가 ₩140,000</div>
            </div>
            <div className="ix-ctx-block">
              <div className="ix-ctx-key kr">선호 디자이너</div>
              <div className="ix-ctx-val kr">김민지 · 영어 가능</div>
            </div>
            <div className="ix-ctx-block">
              <div className="ix-ctx-key kr">알러지 / 메모</div>
              <div className="ix-ctx-val kr">
                두피 민감 · 향이 강한 제품 피해주세요
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="ix-ctx-history">
            {[
              {
                when: "2026.04.10",
                icon: "💬",
                title: "메시지 12개 교환",
                sub: "예약 변경 문의 → 확정",
              },
              {
                when: "2026.03.22",
                icon: "💳",
                title: "₩140,000 결제",
                sub: "K-Beauty 메이크업 + 헤어",
              },
              {
                when: "2026.03.22",
                icon: "✂",
                title: "시술 완료",
                sub: "김민지 디자이너 · 5점 후기",
              },
              {
                when: "2025.11.18",
                icon: "💳",
                title: "₩140,000 결제",
                sub: "퍼스널 컬러 + 메이크업",
              },
              {
                when: "2025.11.18",
                icon: "✂",
                title: "첫 방문",
                sub: "김민지 디자이너",
              },
            ].map((h, i) => (
              <div key={i} className="ix-hist-row">
                <div className="ix-hist-icon">{h.icon}</div>
                <div className="ix-hist-body">
                  <div className="ix-hist-title kr-display">{h.title}</div>
                  <div className="ix-hist-sub kr">{h.sub}</div>
                </div>
                <div className="ix-hist-when mono">{h.when}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "notes" && (
          <div className="ix-ctx-notes">
            <div className="ix-note-card">
              <div className="ix-note-head kr">2026.03.22 · 지영</div>
              <p className="kr">
                두피 민감해서 약산성 샴푸로 진행. 다음 방문에도 동일하게.
              </p>
            </div>
            <div className="ix-note-card">
              <div className="ix-note-head kr">2025.11.18 · 민지</div>
              <p className="kr">
                퍼스널 컬러 — 라이트 봄 웜톤. 다음에 시도해볼 컬러: 캐러멜
                브라운.
              </p>
            </div>
            <textarea
              className="ix-note-input kr"
              placeholder="새 메모 추가… (매장 내부에만 보입니다)"
            />
          </div>
        )}

        {tab === "risk" && (
          <div className="ix-ctx-risk">
            <div className="ix-risk-row warning">
              <div className="ix-risk-icon">⚠</div>
              <div className="ix-risk-body">
                <div className="ix-risk-title kr-display">
                  마사지 키워드 감지
                </div>
                <div className="ix-risk-meta kr">2026.03.12 · 자동 차단됨</div>
                <div className="ix-risk-detail kr">
                  "머리 마사지도 받을 수 있나요?" — 일반 두피 케어 문의로
                  판단되어 후속 조치 없음.
                </div>
                <button className="ix-risk-link kr">감사 이력 보기 →</button>
              </div>
            </div>
            <div className="ix-risk-row ok">
              <div className="ix-risk-icon">✓</div>
              <div className="ix-risk-body">
                <div className="ix-risk-title kr-display">최근 30일 무사고</div>
                <div className="ix-risk-meta kr">컴플라이언스 깨끗</div>
              </div>
            </div>
            <div className="ix-risk-divider">
              <span className="kr">대화 컨텍스트</span>
            </div>
            <div className="ix-risk-row emo">
              <div className="ix-risk-icon">◐</div>
              <div className="ix-risk-body">
                <div className="ix-risk-title kr-display">감정 무게 — 보통</div>
                <div className="ix-risk-meta kr">
                  최근 메시지 톤: 기대 / 호의적
                </div>
                <div className="ix-risk-detail kr">
                  평소와 비슷한 톤이에요. 평상시 응대 방식으로 충분합니다.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Floating shortcuts ──────────────── */
function Shortcuts() {
  const [open, setOpen] = useS(false);
  const list = [
    { keys: ["J"], desc: "다음 대화" },
    { keys: ["K"], desc: "이전 대화" },
    { keys: ["R"], desc: "답장" },
    { keys: ["A"], desc: "AI 초안 그대로 보내기" },
    { keys: ["E"], desc: "AI 초안 편집" },
    { keys: ["M"], desc: "VIP 표시" },
    { keys: ["✓"], desc: "완료 처리" },
    { keys: ["1", "–", "9"], desc: "템플릿 삽입" },
    { keys: ["⌘", "↵"], desc: "보내기" },
    { keys: ["⌘", "F"], desc: "인박스 검색" },
    { keys: ["?"], desc: "단축키 보기" },
  ];
  return (
    <>
      <button
        className="ix-shortcut-fab"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        ?
      </button>
      {open && (
        <div className="ix-shortcut-overlay" onClick={() => setOpen(false)}>
          <div
            className="ix-shortcut-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ix-shortcut-head">
              <h3 className="kr-display">키보드 단축키</h3>
              <button
                className="ix-shortcut-close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="ix-shortcut-grid">
              {list.map((s, i) => (
                <div key={i} className="ix-shortcut-row">
                  <span className="ix-shortcut-keys">
                    {s.keys.map((k, j) =>
                      k === "–" ? (
                        <span key={j} className="ix-shortcut-dash">
                          –
                        </span>
                      ) : (
                        <kbd key={j}>{k}</kbd>
                      ),
                    )}
                  </span>
                  <span className="ix-shortcut-desc kr">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="ix-shortcut-foot kr">
              ESC 또는 외부 클릭으로 닫기
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ──────────────── App ──────────────── */
function App() {
  const [activeChannel, setActiveChannel] = useS("all");
  const [activeFilter, setActiveFilter] = useS(null);
  const [currentId, setCurrentId] = useS(1);
  const thread = THREADS.find((t) => t.id === currentId) || THREADS[0];

  return (
    <div className="sd-app ix-app" data-screen-label="Inbox">
      <TopHeader />
      <div className="sd-shell">
        <Sidebar />
        <main className="ix-main">
          <ChannelRail
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            currentId={currentId}
            setCurrentId={setCurrentId}
          />
          <ThreadCol thread={thread} />
          <ContextPanel thread={thread} />
        </main>
      </div>
      <Shortcuts />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
