/* global React */
const { useState: useState2, useEffect: useEffect2, useRef: useRef2 } = React;
const Icon2 = window.__hesyaIcons;

// --- 5.1 BUTTON ----------------------------------------------------------
function ButtonBlock() {
  const Search = Icon2.search,
    ChevR = Icon2.chevR,
    Plus = Icon2.plus,
    X = Icon2.x;
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.1</span>
        <h3>Button</h3>
        <span className="desc">5 variants × 4 sizes · with state matrix</span>
      </div>
      <div className="matrix">
        <div className="matrix-row">
          <div className="row-label">Primary</div>
          <div className="row-content">
            <button className="btn btn-primary btn-sm">Confirm</button>
            <button className="btn btn-primary btn-md">Confirm Booking</button>
            <button className="btn btn-primary btn-lg kr">예약 확정</button>
            <button className="btn btn-primary btn-xl">
              <Plus size={18} />
              Confirm Booking
            </button>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Secondary</div>
          <div className="row-content">
            <button className="btn btn-secondary btn-md">Cancel</button>
            <button className="btn btn-secondary btn-md kr">취소</button>
            <button className="btn btn-secondary btn-md">
              <Search size={16} />
              Browse menus
            </button>
            <button className="btn btn-secondary btn-md">
              Next
              <ChevR size={16} />
            </button>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Ghost</div>
          <div className="row-content">
            <button className="btn btn-ghost btn-md">Skip</button>
            <button className="btn btn-ghost btn-md kr">건너뛰기</button>
            <button className="btn btn-ghost btn-md btn-icon-only">
              <Icon2.more size={18} />
            </button>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Destructive</div>
          <div className="row-content">
            <button className="btn btn-destructive btn-md">
              Refund Booking
            </button>
            <button className="btn btn-destructive btn-md kr">환불 처리</button>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Link</div>
          <div className="row-content">
            <button className="btn btn-link">
              View receipt
              <Icon2.arrowUR size={14} />
            </button>
            <button className="btn btn-link kr">자세히 보기 →</button>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">States</div>
          <div className="row-content">
            <button className="btn btn-primary btn-md">Default</button>
            <button
              className="btn btn-primary btn-md"
              style={{
                background: "var(--hesya-amber-600)",
                transform: "translateY(-1px)",
                boxShadow: "var(--shadow-3)",
              }}
            >
              Hover
            </button>
            <button
              className="btn btn-primary btn-md"
              style={{
                outline: "2px solid var(--hesya-amber-500)",
                outlineOffset: 2,
              }}
            >
              Focus
            </button>
            <button className="btn btn-primary btn-md" disabled>
              Disabled
            </button>
            <button className="btn btn-primary btn-md">
              <span className="spinner" />
              Loading…
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.2 CARD ------------------------------------------------------------
function CardBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.2</span>
        <h3>Card</h3>
        <span className="desc">
          plain · accent · photo · KPI · shadow-2 default, lift on hover
        </span>
      </div>
      <div className="cards-row">
        <div className="dscard">
          <div
            className="caption"
            style={{
              color: "var(--hesya-amber-600)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Store Card
          </div>
          <h4>Stylista — Hongdae</h4>
          <div className="meta kr">서울 마포구 · 헤어 · 네일</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <span className="badge badge-success kr">운영중</span>
            <span className="badge badge-kverified">K-Verified</span>
          </div>
        </div>
        <div className="dscard accent">
          <div
            className="caption"
            style={{
              color: "var(--hesya-amber-600)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Service Card
          </div>
          <h4 className="kr-display">
            Korean Layered Cut · 코리안 레이어드 컷
          </h4>
          <div className="meta">90 min · stylist Jiyoon</div>
          <div className="price mono">₩ 145,000</div>
        </div>
        <div className="dscard photo">
          <div className="img"></div>
          <div className="pad">
            <div
              className="caption"
              style={{
                color: "var(--hesya-amber-600)",
                textTransform: "uppercase",
              }}
            >
              Booking Card
            </div>
            <h4 style={{ marginTop: 4 }}>Sakura · 2026.05.04 · 14:00</h4>
            <div className="meta">Glass Skin Makeup · 60 min</div>
          </div>
        </div>
        <div className="dscard">
          <div
            className="caption"
            style={{
              color: "var(--hesya-amber-600)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Hover state
          </div>
          <h4>↑ Hover any card to see lift</h4>
          <div className="meta">
            shadow-2 → shadow-3, 4px translateY, 220ms ease
          </div>
        </div>
      </div>
      <div className="cards-row kpi" style={{ marginTop: 20 }}>
        <div className="kpi-tile">
          <div className="lbl">Today's bookings</div>
          <div className="val mono">17</div>
          <div className="delta up mono">▲ +4 vs avg</div>
        </div>
        <div className="kpi-tile">
          <div className="lbl">Settlement (April)</div>
          <div className="val mono">₩ 4,820,000</div>
          <div className="delta up mono">▲ 12.4%</div>
        </div>
        <div className="kpi-tile">
          <div className="lbl">No-show rate</div>
          <div className="val mono">2.1%</div>
          <div className="delta down mono">▼ -0.4pp</div>
        </div>
        <div className="kpi-tile">
          <div className="lbl">Avg. review</div>
          <div className="val mono">4.92</div>
          <div className="delta up mono">▲ from 247 women</div>
        </div>
      </div>
    </div>
  );
}

// --- 5.3 INPUT ------------------------------------------------------------
function FieldDemo({
  label,
  value,
  h = "h-48",
  error,
  helper,
  prefix,
  suffix,
  multi,
  kr,
  focused,
  password,
}) {
  const [v, setV] = useState2(value || "");
  const [f, setF] = useState2(!!focused);
  const filled = v.length > 0;
  return (
    <div style={{ minWidth: 240 }}>
      <div
        className={`field ${h} ${kr ? "kr" : ""} ${prefix ? "has-prefix" : ""} ${error ? "error" : ""} ${f || focused ? "focused" : ""} ${filled ? "filled" : ""}`}
        onClick={() => setF(true)}
      >
        {prefix && <span className="field-prefix">{prefix}</span>}
        <label>{label}</label>
        {multi ? (
          <textarea
            value={v}
            onChange={(e) => setV(e.target.value)}
            onFocus={() => setF(true)}
            onBlur={() => setF(false)}
          />
        ) : (
          <input
            type={password ? "password" : "text"}
            value={v}
            onChange={(e) => setV(e.target.value)}
            onFocus={() => setF(true)}
            onBlur={() => setF(false)}
          />
        )}
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {helper && (
        <div className={"field-helper" + (error ? " error" : "")}>{helper}</div>
      )}
    </div>
  );
}

function InputBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.3</span>
        <h3>Input · Text Field</h3>
        <span className="desc">
          Floating label · 40 / 48h · prefix, suffix, error, multiline
        </span>
      </div>
      <div className="matrix">
        <div className="matrix-row">
          <div className="row-label">Default</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo label="Email address" h="h-40" />
            <FieldDemo label="Booking name" h="h-48" value="Sakura Tanaka" />
            <FieldDemo
              label="Salon name"
              h="h-48"
              kr
              value="스타일리스타 홍대점"
            />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Focused</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo
              label="Phone number"
              h="h-48"
              focused
              value="+82 10"
              prefix="📞"
              helper="We send booking SMS in your language."
            />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">With unit</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo
              label="Service price"
              h="h-48"
              value="145000"
              suffix="₩"
            />
            <FieldDemo label="Duration" h="h-48" value="90" suffix="min" />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Password</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo
              label="Password"
              h="h-48"
              value="hesya2026"
              password
              suffix={
                <span style={{ cursor: "pointer", color: "var(--gray-500)" }}>
                  👁
                </span>
              }
            />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Multiline</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo
              label="Special requests · 특이사항"
              h="h-48"
              kr
              multi
              value="알러지가 있어요. 색상 빼고 진행해 주세요."
            />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Error</div>
          <div className="row-content" style={{ gap: 16 }}>
            <FieldDemo
              label="Business reg. number"
              h="h-48"
              value="123-45-6789"
              error
              helper="⚠ Number not found in NTS registry."
            />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Disabled</div>
          <div className="row-content" style={{ gap: 16 }}>
            <div
              className="field h-48"
              style={{ background: "var(--gray-50)", color: "var(--gray-300)" }}
            >
              <label style={{ top: 6, fontSize: 11, color: "var(--gray-300)" }}>
                Verified business name
              </label>
              <input
                value="Stylista Co., Ltd."
                disabled
                style={{ color: "var(--gray-300)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.4 SELECT ----------------------------------------------------------
function SelectDemo({ items, placeholder, multi }) {
  const [open, setOpen] = useState2(false);
  const [sel, setSel] = useState2(multi ? [items[0], items[2]] : null);
  const ref = useRef2();
  useEffect2(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  if (multi) {
    return (
      <div ref={ref} style={{ position: "relative", minWidth: 280 }}>
        <div
          className={"chip-multi" + (open ? " open" : "")}
          onClick={() => setOpen(!open)}
          style={{ cursor: "pointer" }}
        >
          {sel.length === 0 && (
            <span style={{ color: "var(--gray-500)", fontSize: 14 }}>
              {placeholder}
            </span>
          )}
          {sel.map((s) => (
            <span className="chip kr" key={s}>
              {s}
              <span
                className="x"
                onClick={(e) => {
                  e.stopPropagation();
                  setSel(sel.filter((x) => x !== s));
                }}
              >
                ✕
              </span>
            </span>
          ))}
        </div>
        {open && (
          <div className="select-pop">
            {items.map((it) => (
              <div
                key={it}
                className={
                  "select-item" + (sel.includes(it) ? " selected" : "")
                }
                onClick={() => {
                  setSel(
                    sel.includes(it)
                      ? sel.filter((x) => x !== it)
                      : [...sel, it],
                  );
                }}
              >
                <span className="kr">{it}</span>
                {sel.includes(it) && <span className="check">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div ref={ref} style={{ position: "relative", minWidth: 240 }}>
      <div
        className={"select" + (open ? " open" : "")}
        onClick={() => setOpen(!open)}
      >
        {sel ? (
          <span className="selected kr">{sel}</span>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="caret">▾</span>
      </div>
      {open && (
        <div className="select-pop">
          {items.map((it) => (
            <div
              key={it}
              className={"select-item" + (sel === it ? " selected" : "")}
              onClick={() => {
                setSel(it);
                setOpen(false);
              }}
            >
              <span className="kr">{it}</span>
              {sel === it && <span className="check">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectBlock() {
  const cats = [
    "헤어 / Hair",
    "네일 / Nail",
    "메이크업 / Makeup",
    "퍼스널컬러 / Personal Color",
  ];
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.4</span>
        <h3>Select · Dropdown</h3>
        <span className="desc">
          Single & multi · K-beauty categories · clearable, searchable
        </span>
      </div>
      <div className="matrix">
        <div className="matrix-row">
          <div className="row-label">Single</div>
          <div className="row-content">
            <SelectDemo items={cats} placeholder="Choose category" />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Multi</div>
          <div className="row-content">
            <SelectDemo items={cats} placeholder="Pick services" multi />
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Searchable</div>
          <div className="row-content">
            <div className="select" style={{ minWidth: 280 }}>
              <Icon2.search size={16} color="var(--gray-500)" />
              <span className="placeholder" style={{ marginLeft: 8 }}>
                Search 도쿄 · Tokyo · 東京…
              </span>
              <span className="caret">▾</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.5 DATEPICKER ------------------------------------------------------
function DatepickerBlock() {
  const [sel, setSel] = useState2(14);
  const [slot, setSlot] = useState2("14:30");
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2; // start with Sun = -2
    return day > 0 && day <= 30 ? day : null;
  });
  const slots = [];
  for (let h = 10; h < 19; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  const disabled = ["10:00", "10:30"];
  const full = ["13:00", "13:30", "16:00", "16:30"];
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.5</span>
        <h3>Datepicker</h3>
        <span className="desc">
          Calendar + 30-min time slots · KR + EN weekday labels
        </span>
      </div>
      <div className="datepicker">
        <div>
          <div className="cal-head">
            <div className="title">May 2026 · 5월</div>
            <div className="cal-nav">
              <button>‹</button>
              <button>›</button>
            </div>
          </div>
          <div className="cal-grid">
            {[
              ["S", "일"],
              ["M", "월"],
              ["T", "화"],
              ["W", "수"],
              ["T", "목"],
              ["F", "금"],
              ["S", "토"],
            ].map(([e, k], i) => (
              <div key={i} className="dow">
                <span>{e}</span>
                <span className="kr">{k}</span>
              </div>
            ))}
            {days.map((d, i) =>
              d === null ? (
                <div key={i} className="cal-cell muted">
                  &nbsp;
                </div>
              ) : (
                <div
                  key={i}
                  className={`cal-cell ${d === sel ? "selected" : ""} ${d === 30 ? "today" : ""}`}
                  onClick={() => setSel(d)}
                >
                  {d}
                </div>
              ),
            )}
          </div>
        </div>
        <div className="slots-pane">
          <div className="slots-title">May {sel}, 2026</div>
          <div className="slots">
            {slots.map((s) => {
              const isDis = disabled.includes(s);
              const isFull = full.includes(s);
              const cls =
                "slot" +
                (isDis ? " disabled" : "") +
                (isFull ? " full" : "") +
                (s === slot ? " selected" : "");
              return (
                <div
                  key={s}
                  className={cls}
                  onClick={() => !isDis && !isFull && setSlot(s)}
                >
                  {s}
                  {isFull && (
                    <div style={{ fontSize: 9, opacity: 0.7 }}>full</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.6 MODAL -----------------------------------------------------------
function ModalBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.6</span>
        <h3>Modal</h3>
        <span className="desc">
          centered · max-w 480/640/800 · backdrop blur(8px)
        </span>
      </div>
      <div className="modal-demo">
        <div className="modal">
          <div className="head">
            <h4>Confirm refund · 환불 확인</h4>
            <Icon2.x size={20} color="var(--gray-500)" />
          </div>
          <div className="body kr">
            결제 금액 ₩ 145,000을(를) Sakura Tanaka 고객에게 환불합니다. 영업일
            기준 3일 이내 카드사로 처리됩니다.
          </div>
          <div className="foot">
            <button className="btn btn-secondary btn-md">Cancel</button>
            <button className="btn btn-destructive btn-md">
              Refund ₩ 145,000
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.7 SHEET -----------------------------------------------------------
function SheetBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.7</span>
        <h3>Sheet</h3>
        <span className="desc">Mobile bottom sheet · desktop side drawer</span>
      </div>
      <div className="sheet-row">
        <div>
          <div className="sub-label">Mobile · bottom sheet</div>
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-bottom-sheet">
                <div className="handle" />
                <h4 className="kr-display">AI 사진 분석 결과</h4>
                <p
                  className="kr body-sm"
                  style={{ color: "var(--gray-700)", marginTop: 4 }}
                >
                  봄 웜톤 · 글래스 스킨 추천. 추천 시술 3개를 검토해 보세요.
                </p>
                <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "var(--hesya-peach-50)",
                      borderRadius: "var(--r-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        Glass Skin Makeup
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                        60 min · ₩ 88,000
                      </div>
                    </div>
                    <Icon2.chevR size={16} color="var(--gray-500)" />
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "var(--hesya-peach-50)",
                      borderRadius: "var(--r-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        Personal Color 진단
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                        40 min · ₩ 65,000
                      </div>
                    </div>
                    <Icon2.chevR size={16} color="var(--gray-500)" />
                  </div>
                  <button
                    className="btn btn-primary btn-md"
                    style={{ marginTop: 8, justifyContent: "center" }}
                  >
                    Book this look
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="sub-label">Desktop · side drawer (480w)</div>
          <div className="desktop-drawer">
            <div className="canvas">— underlying page dimmed —</div>
            <div className="drawer">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h4>Customer · Sakura Tanaka</h4>
                <Icon2.x size={20} color="var(--gray-500)" />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 16,
                  alignItems: "center",
                }}
              >
                <div className="avatar s56">S</div>
                <div>
                  <div style={{ fontWeight: 600 }}>🇯🇵 Sakura Tanaka</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    3 visits · last visit 2026.04.18
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="sub-label">Recent messages</div>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--hesya-peach-50)",
                    borderRadius: "var(--r-md)",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                  className="kr"
                >
                  안녕하세요, 5월 4일 14시 가능할까요?
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "white",
                    border: "1px solid var(--gray-100)",
                    borderRadius: "var(--r-md)",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  Yes — see you then.
                </div>
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-md">
                  Send message
                </button>
                <button className="btn btn-primary btn-md">Book again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.8 TOAST -----------------------------------------------------------
function ToastBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.8</span>
        <h3>Toast</h3>
        <span className="desc">
          success · warning · danger · info · 4s auto-dismiss
        </span>
      </div>
      <div className="row" style={{ gap: 16 }}>
        <div className="toast success">
          <span className="toast-ico">✓</span>
          <div>
            <div className="title">
              예약이 확정되었습니다 · Booking confirmed
            </div>
            <div className="msg kr">
              Sakura · 2026.05.04 14:00 · Glass Skin Makeup
            </div>
          </div>
          <span className="close">✕</span>
        </div>
        <div className="toast warning">
          <span className="toast-ico">⚠</span>
          <div>
            <div className="title">Manual review needed</div>
            <div className="msg">
              사업자등록번호가 NTS에서 확인되지 않습니다. 검수팀이 24시간 내에
              연락드립니다.
            </div>
          </div>
          <span className="close">✕</span>
        </div>
        <div className="toast danger">
          <span className="toast-ico">!</span>
          <div>
            <div className="title">Refund failed</div>
            <div className="msg">
              카드사 응답 없음. 잠시 후 다시 시도해 주세요.
            </div>
          </div>
          <span className="close">✕</span>
        </div>
        <div className="toast info">
          <span className="toast-ico">↻</span>
          <div>
            <div className="title">AI translating · 翻訳中</div>
            <div className="msg">한국어 답변을 일본어로 번역하고 있어요…</div>
          </div>
          <span className="close">✕</span>
        </div>
      </div>
    </div>
  );
}

// --- 5.9 BADGE -----------------------------------------------------------
function BadgeBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.9</span>
        <h3>Badge</h3>
        <span className="desc">
          Pill, 22h · status, KYC, K-Verified gold tint, female-friendly trust
          badges
        </span>
      </div>
      <div className="matrix">
        <div className="matrix-row">
          <div className="row-label">Status</div>
          <div className="row-content">
            <span className="badge badge-success kr">운영중 / Open</span>
            <span className="badge badge-warning kr">검수 대기 / Pending</span>
            <span className="badge badge-danger kr">거절됨 / Rejected</span>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Marker</div>
          <div className="row-content">
            <span className="badge badge-new">NEW</span>
            <span className="badge badge-beta">Beta</span>
            <span className="badge badge-kverified">★ K-Verified</span>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Trust (10.2)</div>
          <div className="row-content">
            <span className="badge badge-female">
              <span className="ico">♀</span> Female stylists available
            </span>
            <span className="badge badge-female kr">
              <span className="ico">♀</span> 여성 디자이너 응대 가능
            </span>
            <span className="badge badge-female">♀ 女性スタイリスト対応</span>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Safety</div>
          <div
            className="row-content"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
            }}
          >
            <span className="badge badge-safe-hours kr">
              ☀ 10:00–18:00 · 안전 시간대
            </span>
            <span
              style={{ fontSize: 10, color: "var(--gray-500)", marginLeft: 12 }}
            >
              역에서 도보 5분 · 1층
            </span>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Verified</div>
          <div className="row-content">
            <span className="badge badge-verified-women">
              <span style={{ color: "var(--semantic-success)" }}>✓</span>
              Verified by{" "}
              <span className="mono" style={{ fontWeight: 600 }}>
                247
              </span>{" "}
              women travelers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.10 AVATAR ---------------------------------------------------------
function AvatarBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.10</span>
        <h3>Avatar</h3>
        <span className="desc">
          24 / 32 / 40 / 56 / 80 · photo · initials · store logo · stylist +
          online dot
        </span>
      </div>
      <div className="matrix">
        <div className="matrix-row">
          <div className="row-label">Sizes</div>
          <div className="row-content avatars-row">
            <div className="avatar s24">S</div>
            <div className="avatar s32">JY</div>
            <div className="avatar s40">민</div>
            <div className="avatar s56">SK</div>
            <div className="avatar s80">혜</div>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Photo</div>
          <div className="row-content avatars-row">
            <div className="avatar s40 photo"></div>
            <div className="avatar s56 photo"></div>
            <div className="avatar s80 photo"></div>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Store logo</div>
          <div className="row-content avatars-row">
            <div className="avatar s40 logo">H</div>
            <div className="avatar s56 logo">S</div>
            <div className="avatar s80 logo">스</div>
          </div>
        </div>
        <div className="matrix-row">
          <div className="row-label">Stylist · online</div>
          <div className="row-content avatars-row">
            <div className="avatar s40 photo">
              <span className="dot" />
            </div>
            <div className="avatar s56">
              JY
              <span className="dot" />
            </div>
            <div className="avatar s80 photo">
              <span className="dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5.11 TABS -----------------------------------------------------------
function TabsBlock() {
  const langs = ["한국어", "English", "日本語", "中文(简)", "Tiếng Việt"];
  const [active, setActive] = useState2(0);
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.11</span>
        <h3>Tabs</h3>
        <span className="desc">
          Underline style · amber-500 active line · 5-language Service Menu
          example
        </span>
      </div>
      <div className="matrix">
        <div className="tabs">
          {langs.map((l, i) => (
            <div
              key={i}
              className={"tab" + (i === active ? " active" : "")}
              onClick={() => setActive(i)}
            >
              {l}
            </div>
          ))}
        </div>
        <div
          style={{ padding: "24px 4px 0", color: "var(--gray-700)" }}
          className="kr"
        >
          {active === 0 && (
            <>이 매장은 한국어 · 영어 · 일본어 응대가 가능합니다.</>
          )}
          {active === 1 && (
            <span style={{ fontFamily: "var(--font-body-en)" }}>
              This salon supports Korean, English, and Japanese.
            </span>
          )}
          {active === 2 && <>当店は韓国語・英語・日本語に対応しています。</>}
          {active === 3 && <>本店支持韩语·英语·日语接待。</>}
          {active === 4 && (
            <span style={{ fontFamily: "var(--font-body-en)" }}>
              Tiệm này hỗ trợ tiếng Hàn, tiếng Anh và tiếng Nhật.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 5.12 NAVIGATION -----------------------------------------------------
function NavBlock() {
  return (
    <div className="component-block">
      <div className="component-title">
        <span className="num">5.12</span>
        <h3>Navigation</h3>
        <span className="desc">
          desktop header · sidebar (collapsible) · mobile tab bar
        </span>
      </div>
      <div className="nav-row">
        <div>
          <div className="sub-label">(a) Desktop header — Store Dashboard</div>
          <div className="nav-header">
            <span className="brand">Hesya</span>
            <div className="search">
              <Icon2.search size={14} /> Search bookings, customers, services…
            </div>
            <div className="actions">
              <Icon2.bell size={18} />
              <span
                className="caption"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: 11,
                }}
              >
                EN ▾
              </span>
              <div className="avatar s32">민</div>
            </div>
          </div>
        </div>

        <div>
          <div className="sub-label">
            (b) Desktop sidebar — collapsible 240w / 64w
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div className="nav-side">
              {[
                ["layout", "Dashboard", true],
                ["inbox", "Inbox", false],
                ["calendar", "Bookings", false],
                ["scissors", "Services", false],
                ["users", "Customers", false],
                ["chart", "Analytics", false],
                ["settings", "Settings", false],
              ].map(([k, l, a]) => {
                const Ic = Icon2[k];
                return (
                  <div
                    key={k}
                    className={"nav-side-item" + (a ? " active" : "")}
                  >
                    <Ic size={18} />
                    <span className="lbl">{l}</span>
                  </div>
                );
              })}
            </div>
            <div className="nav-side collapsed">
              {[
                "layout",
                "inbox",
                "calendar",
                "scissors",
                "users",
                "chart",
                "settings",
              ].map((k, i) => {
                const Ic = Icon2[k];
                return (
                  <div
                    key={k}
                    className={"nav-side-item" + (i === 0 ? " active" : "")}
                  >
                    <Ic size={18} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="sub-label">(c) Mobile tab bar — customer PWA</div>
          <div
            className="tabbar"
            style={{ maxWidth: 380, gridTemplateColumns: "repeat(4, 1fr)" }}
          >
            <div className="tabbar-item active">
              <Icon2.search size={20} />
              <span>Search</span>
            </div>
            <div className="tabbar-item">
              <Icon2.calendar size={20} />
              <span>Bookings</span>
            </div>
            <div className="tabbar-item">
              <Icon2.message size={20} />
              <span>Chat</span>
            </div>
            <div className="tabbar-item">
              <Icon2.user size={20} />
              <span>MyPage</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 8 }}>
            Language icon lives top-right of header (not in tab bar).
          </p>
        </div>
      </div>
    </div>
  );
}

function Section5() {
  return (
    <section className="ds-section" id="s5">
      <div className="page">
        <SectionHead
          num="05"
          eyebrow="Components"
          title={
            <>
              Twelve <em>quiet</em> primitives.
            </>
          }
          desc="Every variant, every state. KR + EN labels alternate so the dual-language treatment is unambiguous."
        />
        <ButtonBlock />
        <CardBlock />
        <InputBlock />
        <SelectBlock />
        <DatepickerBlock />
        <ModalBlock />
        <SheetBlock />
        <ToastBlock />
        <BadgeBlock />
        <AvatarBlock />
        <TabsBlock />
        <NavBlock />
      </div>
    </section>
  );
}

window.Section5 = Section5;
