/* global React */
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ──────────────── Count-up hook ──────────────── */
function useCountUp(target, duration = 350, prefix = "", suffix = "") {
  const [val, setVal] = useS(0);
  useE(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setVal(target);
      return;
    }
    const sessionKey = "hesya-counted-" + target;
    if (sessionStorage.getItem(sessionKey)) {
      setVal(target);
      return;
    }
    sessionStorage.setItem(sessionKey, "1");
    let start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return prefix + val.toLocaleString() + suffix;
}

/* ──────────────── Sidebar ──────────────── */
function Sidebar({ collapsed, setCollapsed }) {
  const items = [
    { icon: "▦", label: "Dashboard", active: true },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings" },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers" },
    { icon: "◫", label: "Analytics" },
    { icon: "✦", label: "AI Photos" },
    { icon: "⚙", label: "Settings" },
  ];
  return (
    <aside className={"sd-sidebar" + (collapsed ? " is-collapsed" : "")}>
      <button
        className="sd-collapse"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        {collapsed ? "›" : "‹"}
      </button>
      <nav className="sd-nav">
        {items.map((it) => (
          <button
            key={it.label}
            className={"sd-nav-item" + (it.active ? " active" : "")}
          >
            <span className="sd-icon">{it.icon}</span>
            {!collapsed && <span className="sd-label">{it.label}</span>}
            {!collapsed && it.badge != null && (
              <span className="sd-badge">{it.badge}</span>
            )}
            {collapsed && it.badge != null && <span className="sd-badge-dot" />}
          </button>
        ))}
      </nav>
      <div className="sd-store">
        <div className="sd-store-logo">S</div>
        {!collapsed && (
          <div className="sd-store-meta">
            <div className="sd-store-name kr-display">Stylista 홍대점</div>
            <div className="sd-store-status">
              <span className="dot" />
              영업 중 · 09:00–21:00
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ──────────────── Top header ──────────────── */
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
        <button className="sd-icon-btn" aria-label="Notifications">
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

/* ──────────────── Bright spot card (rotating) ──────────────── */
function BrightSpot() {
  const items = [
    "어제 일본인 손님 3명 모두 5점 리뷰 남겼어요",
    "신규 외국인 손님 7명 — 이번 주 신기록",
    "AI가 어제 28건 메시지 자동 처리 — 약 4시간 절약",
  ];
  const [idx, setIdx] = useS(0);
  useE(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sd-bright-spot">
      <div className="sd-bright-eyebrow">
        <span>✨</span>
        <span className="kr">오늘의 좋은 소식</span>
        <span className="bright-en">Today's bright spot</span>
      </div>
      <div className="sd-bright-body kr-display" key={idx}>
        {items[idx]}
      </div>
      <a className="sd-bright-more">더 보기 →</a>
      <div className="sd-bright-dots">
        {items.map((_, i) => (
          <span key={i} className={"dot" + (i === idx ? " active" : "")} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────── KPI Tiles ──────────────── */
function TileBookings() {
  const num = useCountUp(7, 350);
  const hours = [1, 2, 0, 3, 1, 0, 2, 1, 1, 0, 2, 0];
  const max = Math.max(...hours);
  return (
    <div className="sd-tile sd-tile-A" style={{ animationDelay: "0ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">오늘의 외국인 예약</h3>
        <a className="sd-tile-link">예약 보기 →</a>
      </div>
      <div className="sd-tile-body sd-row-flex">
        <div className="sd-bignum">{num}</div>
        <div className="sd-tile-A-right">
          <div className="sd-mini-avatars">
            <div className="sd-mini-avatar" style={{ background: "#F5DDC8" }}>
              🇯🇵
            </div>
            <div className="sd-mini-avatar" style={{ background: "#F8E9D9" }}>
              🇨🇳
            </div>
            <div className="sd-mini-avatar" style={{ background: "#FDF8F1" }}>
              🇺🇸
            </div>
            <div className="sd-mini-more">+4</div>
          </div>
          <div className="sd-mini-label kr">다음 시술 — 14:00 사쿠라님</div>
        </div>
      </div>
      <div className="sd-spark">
        {hours.map((v, i) => (
          <div
            key={i}
            className="sd-spark-bar"
            style={{
              height: ((v / max) * 100 || 6) + "%",
              background:
                i === 5 ? "var(--hesya-amber-500)" : "var(--hesya-peach-200)",
            }}
          />
        ))}
      </div>
      <div className="sd-spark-axis">
        <span>09</span>
        <span>12</span>
        <span className="now kr">지금</span>
        <span>17</span>
        <span>21</span>
      </div>
    </div>
  );
}

function TileGMV() {
  return (
    <div className="sd-tile sd-tile-B" style={{ animationDelay: "40ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">이번 주 외국인 매출</h3>
      </div>
      <div className="sd-bignum-mono mono">
        <span className="won">₩</span>4,280,000
      </div>
      <div className="sd-pill-success">지난주 대비 +24% ↑</div>
      <div className="sd-bars">
        {[40, 55, 48, 70, 62, 85, 92].map((v, i) => (
          <div key={i} className="sd-bar-col">
            <div className="sd-bar" style={{ height: v + "%" }} />
            <div className="sd-bar-day">
              {["월", "화", "수", "목", "금", "토", "일"][i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TileInbox() {
  return (
    <div className="sd-tile sd-tile-C" style={{ animationDelay: "80ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">통합 인박스</h3>
        <a className="sd-tile-link">전체 보기 →</a>
      </div>
      <div className="sd-bignum">
        12<span className="sd-bignum-sub kr">미답</span>
      </div>
      <div className="sd-channels">
        {[
          { icon: "📱", label: "인스타그램", n: 5, urgent: true },
          { icon: "💬", label: "카카오톡", n: 4 },
          { icon: "📲", label: "WhatsApp", n: 3 },
        ].map((c) => (
          <button key={c.label} className="sd-channel-row">
            <span className="sd-ch-icon">{c.icon}</span>
            <span className="sd-ch-label kr">{c.label}</span>
            <span className={"sd-ch-count" + (c.urgent ? " urgent" : "")}>
              {c.n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TileDonut() {
  const segs = [
    { flag: "🇯🇵", label: "일본", pct: 35, color: "#D88B5B" },
    { flag: "🇨🇳", label: "중국 (간체)", pct: 25, color: "#E8A97A" },
    { flag: "🇨🇳", label: "중국 (번체)", pct: 18, color: "#F5DDC8" },
    { flag: "🇺🇸", label: "미국", pct: 14, color: "#1A2238" },
    { flag: "🇻🇳", label: "베트남", pct: 8, color: "#E8C4D6" },
  ];
  let cum = 0;
  const r = 78,
    c = 2 * Math.PI * r;
  return (
    <div className="sd-tile sd-tile-D" style={{ animationDelay: "120ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">주간 외국인 손님 국적</h3>
        <span className="sd-tile-sub kr">전체 47명</span>
      </div>
      <div className="sd-donut-wrap">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="sd-donut-svg"
        >
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke="var(--hesya-peach-100)"
            strokeWidth="20"
          />
          {segs.map((s, i) => {
            const len = (s.pct / 100) * c;
            const offset = c - cum;
            cum += len;
            return (
              <circle
                key={i}
                cx="110"
                cy="110"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={offset}
                transform="rotate(-90 110 110)"
              />
            );
          })}
          <text x="110" y="106" textAnchor="middle" className="sd-donut-num">
            47
          </text>
          <text x="110" y="128" textAnchor="middle" className="sd-donut-cap">
            손님
          </text>
        </svg>
        <div className="sd-donut-legend">
          {segs.map((s, i) => (
            <div key={i} className="sd-legend-row">
              <span
                className="sd-legend-swatch"
                style={{ background: s.color }}
              />
              <span className="sd-legend-flag">{s.flag}</span>
              <span className="sd-legend-label kr">{s.label}</span>
              <span className="sd-legend-pct mono">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TileAI() {
  const r = 60,
    c = 2 * Math.PI * r;
  const pct = 94;
  return (
    <div className="sd-tile sd-tile-E" style={{ animationDelay: "160ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">AI 응답 정확도</h3>
      </div>
      <div className="sd-circ-wrap">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="var(--hesya-peach-100)"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="var(--hesya-amber-500)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform="rotate(-90 80 80)"
          />
          <text x="80" y="78" textAnchor="middle" className="sd-circ-num">
            {pct}
          </text>
          <text x="80" y="96" textAnchor="middle" className="sd-circ-pct">
            %
          </text>
        </svg>
      </div>
      <p className="sd-tile-cap kr">
        이번 주 AI가 처리한 메시지 <strong>142건</strong>
      </p>
    </div>
  );
}

function TileVerified() {
  return (
    <div className="sd-tile sd-tile-F" style={{ animationDelay: "200ms" }}>
      <div className="sd-tile-head">
        <h3 className="kr-display">K-Verified 상태</h3>
      </div>
      <div className="sd-verified-band">
        <span className="sd-ribbon">✓</span>
        <span className="kr-display">인증 완료</span>
      </div>
      <div className="sd-verified-meta">
        <div className="kr">
          <span className="sd-meta-key">레벨</span> Gold Tier
        </div>
        <div className="kr">
          <span className="sd-meta-key">다음 재검증</span>{" "}
          <span className="mono">2026-07-15</span>
        </div>
      </div>
      <a className="sd-tile-link">검증 이력 보기 →</a>
    </div>
  );
}

/* ──────────────── Today timeline ──────────────── */
function Timeline() {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const bookings = [
    {
      start: 9.5,
      end: 11,
      foreign: false,
      stylist: "민지",
      service: "커트 + 펌",
      flag: "🇰🇷",
      customer: "김민서",
      row: 0,
    },
    {
      start: 10,
      end: 12,
      foreign: true,
      stylist: "지영",
      service: "K-Beauty 메이크업",
      flag: "🇯🇵",
      customer: "Sakura",
      row: 1,
    },
    {
      start: 12.5,
      end: 14,
      foreign: false,
      stylist: "수진",
      service: "네일 케어",
      flag: "🇰🇷",
      customer: "이지은",
      row: 0,
    },
    {
      start: 14,
      end: 16,
      foreign: true,
      stylist: "지영",
      service: "퍼스널 컬러 + 헤어",
      flag: "🇨🇳",
      customer: "Wei",
      row: 1,
      current: true,
    },
    {
      start: 13.5,
      end: 15,
      foreign: true,
      stylist: "민지",
      service: "Glow Makeup",
      flag: "🇺🇸",
      customer: "Emma",
      row: 0,
    },
    {
      start: 15.5,
      end: 17.5,
      foreign: true,
      stylist: "수진",
      service: "K-Wave 헤어",
      flag: "🇯🇵",
      customer: "Yuki",
      row: 0,
    },
    {
      start: 16.5,
      end: 18,
      foreign: false,
      stylist: "지영",
      service: "드라이 + 트리트먼트",
      flag: "🇰🇷",
      customer: "박서연",
      row: 1,
    },
    {
      start: 18,
      end: 20,
      foreign: true,
      stylist: "민지",
      service: "K-Beauty 풀세트",
      flag: "🇻🇳",
      customer: "Linh",
      row: 0,
    },
    {
      start: 19,
      end: 20.5,
      foreign: true,
      stylist: "지영",
      service: "브라이덜 트라이얼",
      flag: "🇨🇳",
      customer: "Mei",
      row: 1,
    },
  ];
  const startH = 9,
    endH = 21;
  const span = endH - startH;
  const nowH = 14.4;
  const [hover, setHover] = useS(null);

  return (
    <div className="sd-timeline">
      <div className="sd-section-head">
        <h2 className="kr-display">오늘의 일정</h2>
        <div className="sd-section-actions">
          <span className="sd-stylist-chip">
            <span
              className="sd-stylist-dot"
              style={{ background: "var(--hesya-amber-500)" }}
            />
            지영
          </span>
          <span className="sd-stylist-chip">
            <span
              className="sd-stylist-dot"
              style={{ background: "var(--hesya-peach-200)" }}
            />
            민지
          </span>
          <span className="sd-stylist-chip">
            <span
              className="sd-stylist-dot"
              style={{ background: "var(--gray-300)" }}
            />
            수진
          </span>
          <span className="sd-divider-v" />
          <span className="sd-tl-legend">
            <span className="dot peach" />
            <span className="kr">외국인</span>
            <span className="dot gray" />
            <span className="kr">내국인</span>
          </span>
        </div>
      </div>

      <div className="sd-tl-axis">
        {hours.map((h) => (
          <div key={h} className="sd-tl-tick">
            <span className="mono">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
      </div>

      <div className="sd-tl-tracks">
        <div
          className="sd-tl-now"
          style={{ left: ((nowH - startH) / span) * 100 + "%" }}
        >
          <span className="sd-now-cap kr">지금 14:24</span>
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="sd-tl-row">
            <div className="sd-tl-row-label kr">
              {row === 0 ? "1번 자리" : "2번 자리"}
            </div>
            <div className="sd-tl-row-track">
              {bookings
                .filter((b) => b.row === row)
                .map((b, i) => {
                  const left = ((b.start - startH) / span) * 100;
                  const w = ((b.end - b.start) / span) * 100;
                  return (
                    <div
                      key={i}
                      className={
                        "sd-tl-block" +
                        (b.foreign ? " foreign" : "") +
                        (b.current ? " current" : "")
                      }
                      style={{
                        left: left + "%",
                        width: w + "%",
                        animationDelay: i * 80 + "ms",
                      }}
                      onMouseEnter={() =>
                        setHover({ ...b, idx: row + "-" + i })
                      }
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="sd-tl-block-time mono">
                        {Math.floor(b.start)}:
                        {String((b.start % 1) * 60).padStart(2, "0")}
                      </div>
                      <div className="sd-tl-block-line">
                        <span className="sd-tl-flag">{b.flag}</span>
                        <span className="sd-tl-customer">{b.customer}</span>
                      </div>
                      <div className="sd-tl-block-service kr">{b.service}</div>
                      <div className="sd-tl-block-stylist kr">
                        — {b.stylist}
                      </div>
                      {hover && hover.idx === row + "-" + i && (
                        <div className="sd-tl-popover">
                          <div className="sd-pop-head">
                            <span className="sd-tl-flag">{b.flag}</span>
                            <strong>{b.customer}</strong>
                            <span className="sd-pop-time mono">
                              {Math.floor(b.start)}:
                              {String((b.start % 1) * 60).padStart(2, "0")}–
                              {Math.floor(b.end)}:
                              {String((b.end % 1) * 60).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="sd-pop-service kr">
                            {b.service} · {b.stylist}
                          </div>
                          <div className="sd-pop-actions">
                            <button className="sd-btn-ghost-sm kr">상세</button>
                            <button className="sd-btn-ghost-sm kr">
                              메시지
                            </button>
                            <button className="sd-btn-ghost-sm kr">변경</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── AI Insight (empathetic copy) ──────────────── */
function AIInsight() {
  const [state, setState] = useS("open"); // open | modify | dismissed | approved
  if (state === "dismissed") return null;
  return (
    <div className="sd-insight">
      <div className="sd-insight-icon">💡</div>
      <div className="sd-insight-body">
        <div className="sd-insight-eyebrow">
          <span className="kr">AI 인사이트</span>
          <span className="sd-insight-confidence kr">신뢰도 높음</span>
        </div>
        <p className="sd-insight-text kr-display">
          일본인 손님 +40% — <em>사장님 응대 정말 잘하고 계세요.</em> 더
          도움드리려면 일본어 시술 메뉴 페이지를 보강하면 좋겠어요. 객단가 약
          12% 상승 가능.
        </p>
        {state === "modify" && (
          <div className="sd-insight-modify">
            <textarea
              defaultValue="메뉴 보강은 좋지만, 일본어 후기 강화가 먼저 필요해요."
              className="kr"
            />
            <div className="sd-insight-modify-actions">
              <button
                className="sd-btn-amber-sm kr"
                onClick={() => setState("approved")}
              >
                수정한 내용으로 진행
              </button>
              <button
                className="sd-btn-ghost-sm kr"
                onClick={() => setState("open")}
              >
                취소
              </button>
            </div>
          </div>
        )}
        {state === "approved" && (
          <div className="sd-insight-approved kr">
            ✓ 승인됨 — 작업이 백그라운드에서 진행 중이에요.
          </div>
        )}
      </div>
      {state === "open" && (
        <div className="sd-insight-actions">
          <button
            className="sd-btn-amber kr"
            onClick={() => setState("approved")}
          >
            메뉴 편집 →
          </button>
          <button
            className="sd-btn-ghost kr"
            onClick={() => setState("modify")}
          >
            제안 수정
          </button>
          <button
            className="sd-btn-ghost kr"
            onClick={() => setState("dismissed")}
          >
            다음에 보기
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Recent reviews ──────────────── */
function Reviews() {
  const reviews = [
    {
      flag: "🇯🇵",
      lang: "日本語",
      stars: 5,
      quote: "今までで一番のヘアスタイル！スタイリストさん、本当に親切でした。",
      trans: "지금까지 최고의 헤어스타일! 스타일리스트분 정말 친절했어요.",
      time: "2시간 전",
      name: "Sakura T.",
      photo: true,
    },
    {
      flag: "🇺🇸",
      lang: "English",
      stars: 5,
      quote: "Worth flying to Seoul for. The K-glow makeup is unreal.",
      trans:
        "서울까지 비행할 가치가 있어요. K-글로우 메이크업은 정말 대단했어요.",
      time: "6시간 전",
      name: "Emma K.",
    },
    {
      flag: "🇨🇳",
      lang: "简体中文",
      stars: 4,
      quote: "非常专业，发型师懂我想要的感觉，下次还会再来。",
      trans: "매우 전문적이고, 디자이너가 제가 원하는 느낌을 잘 이해했어요.",
      time: "어제",
      name: "Wei L.",
    },
  ];
  return (
    <div className="sd-reviews">
      <div className="sd-section-head">
        <h2 className="kr-display">최근 후기</h2>
        <a className="sd-section-link">전체 후기 →</a>
      </div>
      <div className="sd-reviews-grid">
        {reviews.map((r, i) => (
          <div key={i} className="sd-review-card">
            <div className="sd-review-head">
              <span className="sd-review-flag">{r.flag}</span>
              <span className="sd-review-lang">{r.lang}</span>
              <span className="sd-review-stars">
                {"★".repeat(r.stars)}
                <span className="empty">{"★".repeat(5 - r.stars)}</span>
              </span>
              {r.photo && <span className="sd-review-photo-pip">📷</span>}
            </div>
            <p className="sd-review-quote">"{r.quote}"</p>
            <p className="sd-review-trans kr">"{r.trans}"</p>
            <div className="sd-review-foot">
              <span className="sd-review-name">— {r.name}</span>
              <span className="sd-review-time kr">{r.time}</span>
            </div>
            <button className="sd-btn-ghost-sm kr">AI 답변 초안 보기 →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Celebration toasts ──────────────── */
function Celebrations() {
  const [items, setItems] = useS([
    {
      id: 1,
      kind: "star",
      title: "사쿠라님이 5점을 남겼어요",
      body: '"한국에서 최고의 경험!"',
      emo: "🌸",
      time: "방금",
    },
    {
      id: 2,
      kind: "photo",
      title: "포토 후기가 도착했어요",
      body: "Emma · Glow Makeup 시술",
      emo: "📷",
      time: "3분 전",
    },
    {
      id: 3,
      kind: "growth",
      title: "이번 주 외국인 매출이 한 단계 올라갔어요",
      body: "전주 대비 +24% — 기록 갱신 중",
      emo: "🎉",
      time: "오전",
    },
    {
      id: 4,
      kind: "verified",
      title: "100번째 외국인 손님 — 정말 대단해요",
      body: "K-Verified Gold 갱신 가능",
      emo: "✨",
      time: "어제",
    },
  ]);
  const dismiss = (id) => setItems(items.filter((i) => i.id !== id));

  const Sketch = ({ kind }) => {
    if (kind === "star")
      return (
        <svg viewBox="0 0 60 60" className="cele-sketch">
          <path
            d="M30 10 L36 24 L52 26 L40 36 L44 52 L30 44 L16 52 L20 36 L8 26 L24 24 Z"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="30" cy="30" r="2.5" fill="var(--hesya-amber-500)" />
        </svg>
      );
    if (kind === "photo")
      return (
        <svg viewBox="0 0 60 60" className="cele-sketch">
          <rect
            x="10"
            y="20"
            width="40"
            height="28"
            rx="4"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2"
          />
          <path
            d="M22 20 L26 14 L34 14 L38 20"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2"
          />
          <circle
            cx="30"
            cy="34"
            r="7"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2"
          />
          <circle cx="42" cy="26" r="1.5" fill="var(--hesya-amber-500)" />
        </svg>
      );
    if (kind === "growth")
      return (
        <svg viewBox="0 0 60 60" className="cele-sketch">
          <path
            d="M10 46 Q22 42 28 32 Q34 22 48 14"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M40 14 L48 14 L48 22"
            fill="none"
            stroke="var(--hesya-amber-600)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="14" cy="46" r="1.5" fill="var(--hesya-amber-500)" />
          <circle cx="48" cy="14" r="1.5" fill="var(--hesya-amber-500)" />
        </svg>
      );
    return (
      <svg viewBox="0 0 60 60" className="cele-sketch">
        <path
          d="M16 14 L44 14 L40 30 L44 46 L30 40 L16 46 L20 30 Z"
          fill="none"
          stroke="var(--kverified-gold)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M22 26 L28 32 L38 22"
          fill="none"
          stroke="var(--kverified-gold)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="sd-toast-stack">
      <div className="sd-toast-stack-head">
        <span className="kr">최근 알림</span>
        <span className="sd-toast-stack-count">{items.length}</span>
      </div>
      {items.map((it, i) => (
        <div
          key={it.id}
          className="sd-toast"
          style={{ animationDelay: i * 90 + "ms" }}
        >
          <div className="sd-toast-art">
            <Sketch kind={it.kind} />
          </div>
          <div className="sd-toast-body">
            <div className="sd-toast-emo">{it.emo}</div>
            <div className="sd-toast-title kr-display">{it.title}</div>
            <div className="sd-toast-msg kr">{it.body}</div>
            <div className="sd-toast-time kr">{it.time}</div>
          </div>
          <button
            className="sd-toast-x"
            onClick={() => dismiss(it.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="sd-toast-empty kr">모든 알림을 확인했어요 ✓</div>
      )}
    </div>
  );
}

/* ──────────────── Greeting + alert row ──────────────── */
function Greeting() {
  return (
    <div className="sd-greeting">
      <div className="sd-greet-left">
        <h1 className="sd-greet-title kr-display">
          좋은 아침이에요, <em>지영님.</em>
        </h1>
        <p className="sd-greet-sub kr">
          오늘 외국인 예약 <strong>7건</strong> · 미답 메시지{" "}
          <strong>3건</strong> · 새 후기 <strong>1건</strong>
        </p>
      </div>
      <div className="sd-greet-right">
        <div className="sd-date">
          <div className="sd-date-day mono">2026.04.15</div>
          <div className="sd-date-weekday kr">수요일 · 흐림 18°</div>
        </div>
        <button className="sd-btn-amber sd-priority kr">
          📌 오늘의 우선순위 보기
        </button>
      </div>
    </div>
  );
}

function CriticalAlert() {
  return (
    <div className="sd-alert">
      <span className="sd-alert-icon">⚠</span>
      <span className="sd-alert-text kr">
        <strong>환불 요청 1건</strong> — Emma K.님이 어제 결제 건 환불을
        요청했어요. 24시간 내 회신이 필요합니다.
      </span>
      <button className="sd-btn-ghost-sm kr">지금 처리 →</button>
    </div>
  );
}

/* ──────────────── App ──────────────── */
function App() {
  const [collapsed, setCollapsed] = useS(false);
  return (
    <div className="sd-app" data-screen-label="Store Dashboard">
      <TopHeader />
      <div className="sd-shell">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={"sd-main" + (collapsed ? " full" : "")}>
          <Greeting />
          <CriticalAlert />

          <BrightSpot />

          <div className="sd-bento-row sd-bento-3">
            <TileBookings />
            <TileGMV />
            <TileInbox />
          </div>

          <div className="sd-bento-row sd-row-2">
            <TileDonut />
            <TileAI />
            <TileVerified />
          </div>

          <Timeline />
          <AIInsight />
          <Reviews />
        </main>
        <Celebrations />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
