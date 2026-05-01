/* global React */
const { useState: useS2, useEffect: useE2 } = React;

const { STYLISTS, stylistById } = window.HesyaBkConstants;

/* ──────────────── Side panel ──────────────── */
function SidePanel({ booking, onClose, onAction }) {
  const [tab, setTab] = useS2("info");
  const [showRefund, setShowRefund] = useS2(false);
  const [showCancelConfirm, setShowCancelConfirm] = useS2(false);

  if (!booking) return null;
  const stylist = stylistById(booking.stylist);

  const fmtTime = (t) =>
    Math.floor(t).toString().padStart(2, "0") +
    ":" +
    ((t % 1) * 60 || 0).toString().padStart(2, "0");
  const dur = ((booking.end - booking.start) * 60) | 0;

  // Refund math
  const hoursUntil = 24; // mock
  const refundPct = hoursUntil >= 24 ? 100 : hoursUntil >= 12 ? 50 : 0;
  const refundAmount = Math.round((booking.paid * refundPct) / 100);
  const fee = booking.paid - refundAmount;

  return (
    <aside className="bk-panel" data-screen-label="Booking detail panel">
      <div className="bk-panel-head">
        <button className="bk-panel-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="bk-panel-title-row">
          <span className="bk-panel-flag">{booking.flag}</span>
          <h2 className="kr-display">{booking.kr}</h2>
          {booking.vip && <span className="bk-panel-vip">★ VIP</span>}
        </div>
        <div className="bk-panel-sub kr">
          {fmtTime(booking.start)} – {fmtTime(booking.end)} · {dur}분 · 04.
          {14 + booking.day} (수)
        </div>
      </div>

      {/* Primary actions — ONE primary per zone */}
      <div className="bk-panel-actions">
        {booking.status === "pending" && (
          <button
            className="bk-act-primary kr"
            onClick={() => onAction("confirm")}
          >
            <span style={{ fontSize: 16 }}>✓</span> 확정하기
          </button>
        )}
        {booking.status === "confirmed" && (
          <button
            className="bk-act-primary kr"
            onClick={() => onAction("remind")}
          >
            <span style={{ fontSize: 14 }}>📤</span> 알림 보내기
          </button>
        )}
        <div className="bk-act-row">
          <button
            className="bk-act-ghost kr"
            onClick={() => onAction("reschedule")}
          >
            <span>🗓</span>
            <span>일정 변경</span>
          </button>
          <button
            className="bk-act-ghost kr"
            onClick={() => setShowCancelConfirm(!showCancelConfirm)}
          >
            <span>×</span>
            <span>취소</span>
          </button>
        </div>
        <div className="bk-act-row">
          <button
            className="bk-act-ghost-sm kr"
            onClick={() => onAction("noshow")}
          >
            노쇼
          </button>
          <button
            className="bk-act-ghost-sm kr"
            onClick={() => onAction("tag")}
          >
            태그
          </button>
          <button
            className="bk-act-ghost-sm kr"
            onClick={() => onAction("ics")}
          >
            .ics
          </button>
        </div>
      </div>

      {/* Cancel + refund preview — always shown BEFORE confirmation */}
      {showCancelConfirm && (
        <div className="bk-refund-preview">
          <div className="bk-refund-head kr">취소 시 환불 안내</div>
          <p className="bk-refund-body kr">
            예약까지 <span className="bk-refund-time">{hoursUntil}시간</span>{" "}
            남았어요. 매장 정책에 따라 다음과 같이 환불됩니다.
          </p>
          <div className="bk-refund-rows">
            <div className="bk-refund-row">
              <span className="kr">결제 금액</span>
              <span className="mono">₩{booking.paid.toLocaleString()}</span>
            </div>
            <div className="bk-refund-row">
              <span className="kr">취소 수수료 ({100 - refundPct}%)</span>
              <span className="mono" style={{ color: "var(--gray-500)" }}>
                −₩{fee.toLocaleString()}
              </span>
            </div>
            <div className="bk-refund-row total">
              <span className="kr">환불 금액</span>
              <span className="mono">₩{refundAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="bk-refund-policy kr">
            • 24시간 전 취소 — 100% 환불
            <br />
            • 12시간 전 — 50% 환불
            <br />• 그 이후 — 환불 불가
          </div>
          <div className="bk-refund-actions">
            <button
              className="bk-act-ghost-sm kr"
              onClick={() => setShowCancelConfirm(false)}
            >
              취소하지 않기
            </button>
            <button
              className="bk-act-danger kr"
              onClick={() => {
                onAction("cancel");
                setShowCancelConfirm(false);
              }}
            >
              ₩{refundAmount.toLocaleString()} 환불하고 취소
            </button>
          </div>
        </div>
      )}

      <div className="bk-panel-tabs">
        {[
          { id: "info", label: "Info" },
          { id: "history", label: "History" },
          { id: "notes", label: "Notes" },
          { id: "risk", label: "Risk" },
        ].map((t) => (
          <button
            key={t.id}
            className={"bk-panel-tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bk-panel-body">
        {tab === "info" && (
          <div className="bk-panel-info">
            <div className="bk-info-block">
              <div className="bk-info-key kr">시술</div>
              <div className="bk-info-val kr-display">{booking.service}</div>
              <div className="bk-info-sub kr">
                디자이너 —{" "}
                <span style={{ color: stylist.color }}>● {stylist.name}</span>
              </div>
            </div>
            <div className="bk-info-block highlight">
              <div className="bk-info-key kr">결제 상태</div>
              <div className="bk-info-val mono">
                ₩{booking.paid.toLocaleString()}
              </div>
              <div className="bk-info-sub kr">
                {booking.status === "noshow"
                  ? "환불 처리됨"
                  : booking.paid > 0
                    ? "✓ 전액 결제 완료 (Stripe)"
                    : "미결제"}
              </div>
            </div>
            <div className="bk-info-block">
              <div className="bk-info-key kr">언어 / 채널</div>
              <div className="bk-info-val">
                {booking.foreign
                  ? "日本語 · Instagram DM"
                  : "한국어 · 전화 예약"}
              </div>
            </div>
            <div className="bk-info-block">
              <div className="bk-info-key kr">참고사항</div>
              <div className="bk-info-val kr">
                두피 민감 · 향이 강한 제품 피해주세요.
                <br />
                선호 컬러: 캐러멜 브라운
              </div>
            </div>
            <button
              className="bk-cross-link kr"
              onClick={() => onAction("inbox")}
            >
              <span>💬</span>
              <span>지난 메시지 보기 → 인박스로</span>
              <span style={{ marginLeft: "auto" }}>→</span>
            </button>
          </div>
        )}
        {tab === "history" && (
          <div className="bk-panel-history">
            {[
              {
                when: "2026.03.22",
                icon: "✂",
                title: "K-Beauty 메이크업",
                sub: "₩140,000 · ★ 5점",
              },
              {
                when: "2025.11.18",
                icon: "✂",
                title: "퍼스널컬러 + 메이크업",
                sub: "₩140,000 · 첫 방문",
              },
            ].map((h, i) => (
              <div key={i} className="bk-hist-row">
                <div className="bk-hist-icon">{h.icon}</div>
                <div className="bk-hist-body">
                  <div className="bk-hist-title kr-display">{h.title}</div>
                  <div className="bk-hist-sub kr">{h.sub}</div>
                </div>
                <div className="bk-hist-when mono">{h.when}</div>
              </div>
            ))}
            <div className="bk-hist-summary kr">
              총 2회 방문 · ₩280,000 · 평균 ★ 5.0
            </div>
          </div>
        )}
        {tab === "notes" && (
          <div className="bk-panel-notes">
            <div className="bk-note-card">
              <div className="bk-note-head kr">2026.03.22 · 지영</div>
              <p className="kr">
                두피 민감해서 약산성 샴푸로 진행. 다음에도 동일하게.
              </p>
            </div>
            <textarea
              className="bk-note-input kr"
              placeholder="새 메모 추가… (매장 내부에만 보임)"
            />
          </div>
        )}
        {tab === "risk" && (
          <div className="bk-panel-risk">
            <div className="bk-risk-row ok">
              <div className="bk-risk-icon">✓</div>
              <div className="bk-risk-body">
                <div className="bk-risk-title kr-display">최근 30일 무사고</div>
                <div className="bk-risk-meta kr">컴플라이언스 깨끗</div>
              </div>
            </div>
            <div className="bk-risk-row emo">
              <div className="bk-risk-icon">◐</div>
              <div className="bk-risk-body">
                <div className="bk-risk-title kr-display">감정 무게 — 보통</div>
                <div className="bk-risk-meta kr">
                  최근 메시지 톤: 기대 / 호의적
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ──────────────── Empty state ──────────────── */
function EmptyState() {
  return (
    <div className="bk-empty">
      <svg className="bk-empty-svg" viewBox="0 0 240 180" fill="none">
        <defs>
          <pattern
            id="dotPat"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="0.5" fill="#1A2238" opacity="0.15" />
          </pattern>
        </defs>
        {/* book base */}
        <path
          d="M40 50 L40 150 L200 150 L200 50 L120 38 L40 50 Z"
          fill="#FDF8F1"
          stroke="#1A2238"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M120 38 L120 150"
          stroke="#1A2238"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* page lines (left) */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={"l" + i}
            x1="56"
            y1={64 + i * 12}
            x2="108"
            y2={64 + i * 12}
            stroke="#E0B996"
            strokeWidth="1"
            strokeLinecap="round"
          />
        ))}
        {/* page lines (right) */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={"r" + i}
            x1="132"
            y1={64 + i * 12}
            x2="184"
            y2={64 + i * 12}
            stroke="#E0B996"
            strokeWidth="1"
            strokeLinecap="round"
          />
        ))}
        {/* small clock */}
        <circle
          cx="190"
          cy="58"
          r="14"
          fill="#F5DDC8"
          stroke="#1A2238"
          strokeWidth="1.5"
        />
        <path
          d="M190 50 L190 58 L196 62"
          stroke="#1A2238"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* sparkle */}
        <path
          d="M210 100 L213 106 L219 109 L213 112 L210 118 L207 112 L201 109 L207 106 Z"
          fill="#E8A117"
          opacity="0.6"
        />
      </svg>
      <h3 className="bk-empty-title kr-display">이번 주는 비어 있어요</h3>
      <p className="bk-empty-body kr">
        여유가 있을 때, 외국인 손님 마케팅을 한 번 돌려볼까요?
      </p>
      <p className="bk-empty-en">A quiet week — let's invite some travelers.</p>
      <div className="bk-empty-actions">
        <button className="bk-empty-primary kr">마케팅 자동화 보기 →</button>
        <button className="bk-empty-ghost kr">빈 시간 채우기 가이드</button>
      </div>
    </div>
  );
}

/* ──────────────── Main app ──────────────── */
const {
  TopHeader,
  Sidebar,
  HeaderStrip,
  WeekGrid,
  MonthGrid,
  ListView,
  TimelineView,
} = window.HesyaBkParts;

function App() {
  const [view, setView] = useS2("week");
  const [filter, setFilter] = useS2("all");
  const [selected, setSelected] = useS2(null);
  const [showEmpty, setShowEmpty] = useS2(false);

  const onSelect = (b) => setSelected(b);
  const onAction = (action) => {
    if (action === "inbox") {
      // would navigate to inbox in real app
      setSelected(null);
    } else if (action === "cancel") {
      setSelected(null);
    } else if (action === "confirm") {
      setSelected((s) => (s ? { ...s, status: "confirmed" } : null));
    }
  };

  return (
    <div className="sd-app bk-app" data-screen-label="Bookings">
      <TopHeader />
      <div className="sd-shell">
        <Sidebar />
        <main className={"bk-main" + (selected ? " with-panel" : "")}>
          <HeaderStrip
            view={view}
            setView={setView}
            filter={filter}
            setFilter={setFilter}
          />
          <div className="bk-views">
            <button
              className="bk-empty-toggle kr"
              onClick={() => setShowEmpty(!showEmpty)}
              title="빈 상태 보기"
            >
              {showEmpty ? "예약 다시 보기" : "빈 상태 미리보기"}
            </button>
            {showEmpty ? (
              <EmptyState />
            ) : (
              <>
                {view === "week" && (
                  <WeekGrid onSelect={onSelect} selectedId={selected?.id} />
                )}
                {view === "month" && (
                  <MonthGrid onSelect={() => setView("week")} />
                )}
                {view === "list" && (
                  <ListView onSelect={onSelect} selectedId={selected?.id} />
                )}
                {view === "timeline" && (
                  <TimelineView onSelect={onSelect} selectedId={selected?.id} />
                )}
              </>
            )}
          </div>
        </main>
        {selected && (
          <SidePanel
            booking={selected}
            onClose={() => setSelected(null)}
            onAction={onAction}
          />
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
