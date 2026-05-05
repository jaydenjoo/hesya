/* global React, ReactDOM */
const { useState: stS, useEffect: stE, useRef: stR } = React;
const { TopHeader } = window.HesyaCuParts1;

/* ───────── Sidebar (app shell) ───────── */
function SetNavSidebar() {
  const items = [
    { icon: "▦", label: "Dashboard" },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings" },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers" },
    { icon: "◫", label: "Analytics" },
    { icon: "✦", label: "AI Photos", badge: 18 },
    { icon: "⚙", label: "Settings", active: true },
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

/* ───────── Section sticky nav (right rail) ───────── */
const SECTIONS = [
  { id: "info", num: "01", kr: "매장 정보", en: "Store Info" },
  { id: "hours", num: "02", kr: "영업시간", en: "Hours" },
  { id: "staff", num: "03", kr: "직원 관리", en: "Staff" },
  { id: "channels", num: "04", kr: "채널 연결", en: "Channels" },
  { id: "payment", num: "05", kr: "결제 수단", en: "Payments" },
  { id: "notif", num: "06", kr: "알림", en: "Notifications" },
  { id: "plan", num: "07", kr: "요금제", en: "Plan" },
  { id: "security", num: "08", kr: "보안", en: "Security" },
  {
    id: "risk",
    num: "09",
    kr: "위험 관리",
    en: "Compliance",
    danger: true,
    alert: true,
  },
];

function SectionNav({ active, onJump }) {
  return (
    <aside className="set-snav">
      <div className="set-snav-head">
        <div className="set-snav-eyebrow">Settings</div>
        <div className="set-snav-title">매장 설정</div>
      </div>
      <ul className="set-snav-list">
        {SECTIONS.map((s) => (
          <li
            key={s.id}
            className={
              "set-snav-item" +
              (active === s.id ? " active" : "") +
              (s.danger ? " danger" : "")
            }
            onClick={() => onJump(s.id)}
          >
            <span className="set-snav-num">{s.num}</span>
            <span>{s.kr}</span>
            {s.alert && (
              <span className="alert-dot" title="재서명 30일 후 만료" />
            )}
          </li>
        ))}
      </ul>
      <div className="set-snav-foot">
        <strong>Stylista 홍대점</strong>
        <br />
        마지막 저장 · 2분 전<br />
        편집자 · 박지민
      </div>
    </aside>
  );
}

/* ───────── Page header ───────── */
function PageHeader() {
  return (
    <div className="set-pageheader">
      <div className="set-ph-l">
        <div className="set-ph-eyebrow">Operator · Store Settings</div>
        <div className="set-ph-title">매장 설정</div>
      </div>
      <div className="set-ph-r">
        <div className="set-ph-saved">
          <span className="dot" />
          모든 변경사항 자동 저장됨
        </div>
        <button className="set-btn">변경 이력</button>
        <button className="set-btn primary">미리보기</button>
      </div>
    </div>
  );
}

/* ───────── Section header ───────── */
function SectionHead({ s, help }) {
  return (
    <div className="set-section-h">
      <span className="set-section-num">{s.num}</span>
      <span className="set-section-title">{s.kr}</span>
      <span className="set-section-en">— {s.en}</span>
      {help && <span className="set-section-help">{help}</span>}
    </div>
  );
}

/* ───────── Form row ───────── */
function Row({ label, hint, children }) {
  return (
    <div className="set-row">
      <div className="set-row-label">
        <div className="label">{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div className="set-row-control">{children}</div>
    </div>
  );
}

/* ───────── Lang tabs ───────── */
const LANGS = [
  { code: "ko", flag: "한", name: "Korean" },
  { code: "en", flag: "EN", name: "English" },
  { code: "ja", flag: "日", name: "Japanese" },
  { code: "zh", flag: "中", name: "Chinese" },
  { code: "vi", flag: "VN", name: "Vietnamese" },
];

function LangTabs({ filled, active, setActive }) {
  return (
    <div className="set-langtabs">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={"set-langtab" + (active === l.code ? " active" : "")}
          onClick={() => setActive(l.code)}
        >
          <span className="flag">{l.flag}</span>
          <span>{l.name}</span>
          <span
            className={filled.includes(l.code) ? "filled-dot" : "empty-dot"}
          />
        </button>
      ))}
    </div>
  );
}

/* ═════════ 01 매장 정보 ═════════ */
function StoreInfoSection() {
  const [nameLang, setNameLang] = stS("ko");
  const [introLang, setIntroLang] = stS("ko");

  const names = {
    ko: "Stylista 홍대점",
    en: "Stylista Hongdae",
    ja: "スタイリスタ 弘大店",
    zh: "Stylista 弘大店",
    vi: "Stylista Hongdae",
  };
  const intros = {
    ko: "홍대 골목 안 작은 헤어 살롱. 동양인 모발 결을 가장 잘 아는 디자이너 4인이 머리카락의 결을 살리는 컷과 컬러를 합니다. 외국인 손님은 평일 오전이 한가합니다.",
    en: "A boutique salon tucked into Hongdae's back streets. Four designers who specialize in Asian hair texture — gentle cuts and translucent colors that respect your strands. Weekday mornings are quietest for international guests.",
    ja: "弘大の路地にある小さなヘアサロン。アジアの髪質を熟知したデザイナー4名が、髪の繊維を活かすカットとカラーを行います。",
    zh: "藏在弘大巷弄里的小型美发沙龙。四位深谙亚洲发质的设计师，专注于尊重发丝纹理的温和剪发与通透染色。",
    vi: "",
  };
  const filled = Object.entries(intros)
    .filter(([_, v]) => v)
    .map(([k]) => k);

  return (
    <section id="info" className="set-section" data-section="info">
      <SectionHead s={SECTIONS[0]} help="고객에게 보이는 정보 · 5개 언어" />
      <div className="set-card">
        <div className="set-card-h">
          기본 정보 <span className="small">· KYC 인증 완료</span>
        </div>

        <Row label="매장명" hint="언어별로 표시됩니다. 한국어는 필수.">
          <LangTabs
            filled={["ko", "en", "ja", "zh"]}
            active={nameLang}
            setActive={setNameLang}
          />
          <input
            className="set-input"
            defaultValue={names[nameLang]}
            placeholder={nameLang === "vi" ? "Tên cửa hàng" : ""}
          />
          {nameLang === "ko" && (
            <div className="set-romanized">
              자동 로마자 · Stylista Hongdaejeom
            </div>
          )}
        </Row>

        <Row
          label="사업자등록번호"
          hint="홈택스 K-Verified 완료. 변경 시 재인증 필요."
        >
          <div className="set-input-row">
            <input
              className="set-input readonly mono"
              defaultValue="123-45-67890"
              readOnly
            />
            <span className="k-verified">K-Verified</span>
          </div>
          <div className="set-row-meta">
            <span>인증일 2026-04-15</span>
            <span>·</span>
            <span>대표자 김수정</span>
          </div>
        </Row>

        <Row label="영업신고증 번호" hint="구청 발급 미용업 영업신고증.">
          <input
            className="set-input readonly mono"
            defaultValue="2024-마포-미용-00482"
            readOnly
          />
          <div className="set-row-meta">
            <span>마포구청 발급 · 2024-08-12</span>
            <span>·</span>
            <a
              href="#"
              style={{
                color: "var(--hesya-amber-600)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              PDF 다운로드 →
            </a>
          </div>
        </Row>

        <Row label="매장 카테고리" hint="신고증 기재사항. 분기별 자동 검증.">
          <div className="set-chip-readonly">
            <span className="cat-code">가.</span>
            <span>일반미용업 — Hair General</span>
            <span className="lock">🔒</span>
          </div>
          <div className="set-row-meta">
            <span>
              마사지·발마사지·스파·LED·고주파 등은 본 카테고리 범위 외 (위험
              관리 §09 참조)
            </span>
          </div>
        </Row>

        <Row label="주소" hint="네이버 지도 기반. 번지수까지 정확히.">
          <input
            className="set-input"
            defaultValue="서울특별시 마포구 와우산로 17길 24, 2층"
          />
          <div className="set-romanized">
            2F, 24, Wausan-ro 17-gil, Mapo-gu, Seoul, 04047
          </div>
          <div className="set-row-meta">
            <span>📍 지도 미리보기</span>
            <span>·</span>
            <span>홍대입구역 9번 출구 도보 5분</span>
          </div>
        </Row>

        <Row label="전화" hint="한국 고객용 대표 번호.">
          <div className="set-input-row">
            <div className="set-input-with-icon" style={{ flex: 1 }}>
              <span className="icon">☎</span>
              <input className="set-input mono" defaultValue="02-322-4815" />
            </div>
            <button className="set-btn">
              <span
                style={{
                  color: "#FEE500",
                  background: "#3C1E1E",
                  padding: "1px 4px",
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: 9,
                }}
              >
                K
              </span>{" "}
              카카오톡 채널 연결
            </button>
          </div>
        </Row>

        <Row label="매장 소개" hint="홈페이지 상단 노출. 언어별 작성 권장.">
          <LangTabs
            filled={filled}
            active={introLang}
            setActive={setIntroLang}
          />
          <textarea
            className="set-textarea"
            rows="4"
            defaultValue={intros[introLang]}
            placeholder={introLang === "vi" ? "Giới thiệu về cửa hàng…" : ""}
          />
          <div className="set-row-meta">
            <span>{(intros[introLang] || "").length} / 400자</span>
            <span>·</span>
            <span style={{ color: "var(--hesya-amber-600)" }}>
              ✨ AI로 다른 언어 번역
            </span>
          </div>
        </Row>

        <Row label="매장 사진" hint="첫 번째 사진이 대표 이미지로 사용됩니다.">
          <div className="set-photo-grid">
            {[
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
              "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400",
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400",
              "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400",
              "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400",
              "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400",
            ].map((src, i) => (
              <div key={i} className="set-photo">
                <div
                  className="ph-img"
                  style={{ backgroundImage: `url(${src})` }}
                />
                <div className="ph-handle">⋮⋮</div>
                {i === 0 && <div className="ph-cover">대표</div>}
                <div className="ph-del">×</div>
              </div>
            ))}
            <div className="set-photo-add">
              <span className="plus">+</span>
              <span className="label">사진 추가</span>
            </div>
          </div>
          <div className="set-row-meta">
            <span>JPG · PNG · 최대 10MB · 최대 12장</span>
            <span>·</span>
            <span>드래그하여 순서 변경</span>
          </div>
        </Row>
      </div>
    </section>
  );
}

/* ═════════ 02 영업시간 ═════════ */
function HoursSection() {
  const days = [
    {
      kr: "월요일",
      en: "Mon",
      open: "10:00",
      close: "20:00",
      note: "정기 영업",
      on: true,
    },
    {
      kr: "화요일",
      en: "Tue",
      open: "10:00",
      close: "20:00",
      note: "정기 영업",
      on: true,
    },
    {
      kr: "수요일",
      en: "Wed",
      open: "10:00",
      close: "20:00",
      note: "정기 영업",
      on: true,
    },
    {
      kr: "목요일",
      en: "Thu",
      open: "10:00",
      close: "21:00",
      note: "야간 연장",
      on: true,
    },
    {
      kr: "금요일",
      en: "Fri",
      open: "10:00",
      close: "21:00",
      note: "야간 연장",
      on: true,
    },
    {
      kr: "토요일",
      en: "Sat",
      open: "11:00",
      close: "19:00",
      note: "주말",
      on: true,
      weekend: true,
    },
    {
      kr: "일요일",
      en: "Sun",
      open: "—",
      close: "—",
      note: "정기 휴무",
      on: false,
      weekend: true,
    },
  ];
  return (
    <section id="hours" className="set-section" data-section="hours">
      <SectionHead s={SECTIONS[1]} help="고객 페이지·예약 가능 시간에 적용" />
      <div className="set-card">
        <div className="set-card-h">
          정기 영업 <span className="small">· 점심시간은 별도 미설정</span>
        </div>
        <div className="set-hours">
          <div className="set-hours-head">
            <div>요일</div>
            <div>오픈</div>
            <div>마감</div>
            <div>비고</div>
          </div>
          {days.map((d) => (
            <React.Fragment key={d.en}>
              <div className={"set-hours-day" + (d.weekend ? " weekend" : "")}>
                <div>
                  <span className="name">{d.kr}</span>
                  <span className="en">{d.en}</span>
                </div>
                <div className="set-hours-toggle" style={{ marginTop: 4 }}>
                  <span className={"set-toggle" + (d.on ? " on" : "")} />
                  <span>{d.on ? "영업" : "휴무"}</span>
                </div>
              </div>
              <div className={"set-hours-row" + (!d.on ? " closed" : "")}>
                <div className="set-time-input">
                  <input className="set-time" defaultValue={d.open} />
                </div>
              </div>
              <div className={"set-hours-row" + (!d.on ? " closed" : "")}>
                <div className="set-time-input">
                  <input className="set-time" defaultValue={d.close} />
                </div>
              </div>
              <div className="set-hours-note">{d.note}</div>
            </React.Fragment>
          ))}
        </div>

        <div className="set-holiday-list">
          <div className="set-card-h" style={{ marginBottom: 10 }}>
            특별 휴무일 <span className="small">· 명절·연차 등 일시 휴무</span>
            <button className="set-btn sm" style={{ marginLeft: "auto" }}>
              ＋ 휴무일 추가
            </button>
          </div>
          <div className="set-holiday">
            <span className="date">2026-05-05 · 화</span>
            <span className="reason">어린이날 · 정기 휴무</span>
            <span className="x">×</span>
          </div>
          <div className="set-holiday">
            <span className="date">2026-05-25 ~ 28</span>
            <span className="reason">디자이너 워크샵 · 전 매장 휴무</span>
            <span className="x">×</span>
          </div>
          <div className="set-holiday">
            <span className="date">2026-09-15 ~ 19</span>
            <span className="reason">추석 연휴</span>
            <span className="x">×</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════ 03 직원 관리 ═════════ */
function StaffSection() {
  const staff = [
    {
      name: "박지민",
      role: "원장 · Owner",
      langs: ["KO", "EN"],
      color: "#D88B5B",
      b: 142,
      r: 4.9,
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    {
      name: "이수영",
      role: "수석 디자이너",
      langs: ["KO", "EN", "JA"],
      color: "#7E9B8E",
      b: 98,
      r: 4.8,
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    },
    {
      name: "최민호",
      role: "디자이너",
      langs: ["KO", "EN"],
      color: "#5B7CA8",
      b: 76,
      r: 4.7,
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    },
    {
      name: "한유진",
      role: "디자이너",
      langs: ["KO", "JA", "ZH"],
      color: "#B98532",
      b: 81,
      r: 4.9,
      img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    },
    {
      name: "오나영",
      role: "주니어",
      langs: ["KO"],
      color: "#A07BB8",
      b: 34,
      r: 4.6,
      img: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=200",
    },
  ];
  return (
    <section id="staff" className="set-section" data-section="staff">
      <SectionHead s={SECTIONS[2]} help="예약 캘린더·서비스 카드와 연결됨" />
      <div className="set-card">
        <div className="set-card-h">
          디자이너 5명
          <span className="small">· 색상은 캘린더 시각화에 사용됩니다</span>
          <button className="set-btn primary sm" style={{ marginLeft: "auto" }}>
            ＋ 디자이너 초대
          </button>
        </div>
        <div className="set-staff">
          {staff.map((s) => (
            <div key={s.name} className="set-staff-card">
              <span className="menu">⋯</span>
              <div className="set-staff-top">
                <div
                  className="set-staff-avatar"
                  style={{ backgroundImage: `url(${s.img})` }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span className="set-staff-name">{s.name}</span>
                    <span
                      className="set-staff-color"
                      style={{ background: s.color }}
                      title={s.color}
                    />
                  </div>
                  <div className="set-staff-role">{s.role}</div>
                </div>
              </div>
              <div className="set-staff-langs">
                {s.langs.map((l) => (
                  <span key={l} className="set-staff-lang">
                    {l}
                  </span>
                ))}
              </div>
              <div className="set-staff-stats">
                <div className="set-staff-stat">
                  <div className="v">{s.b}</div>
                  <div className="l">이번달 예약</div>
                </div>
                <div className="set-staff-stat">
                  <div className="v">{s.r}</div>
                  <div className="l">평균 평점</div>
                </div>
              </div>
            </div>
          ))}
          <div className="set-staff-add">
            <span className="plus">＋</span>
            <span className="label">디자이너 초대</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════ 04 채널 연결 ═════════ */
function ChannelsSection() {
  const channels = [
    {
      key: "ig",
      name: "Instagram",
      handle: "@stylista_hongdae",
      status: "connected",
      cls: "ig",
      letter: "IG",
    },
    {
      key: "kk",
      name: "카카오톡 채널",
      handle: "@stylista",
      status: "connected",
      cls: "kk",
      letter: "K",
    },
    {
      key: "line",
      name: "LINE 공식 계정",
      handle: "@stylista-jp",
      status: "connected",
      cls: "line",
      letter: "L",
    },
    {
      key: "naver",
      name: "네이버 톡톡",
      handle: "스타일리스타 홍대점",
      status: "connected",
      cls: "naver",
      letter: "N",
    },
    {
      key: "tiktok",
      name: "TikTok",
      handle: "@stylista.kr",
      status: "connected",
      cls: "tiktok",
      letter: "T",
    },
    {
      key: "web",
      name: "Hesya 매장 페이지",
      handle: "hesya.kr/stylista-hongdae",
      status: "connected",
      cls: "web",
      letter: "H",
    },
  ];
  return (
    <section id="channels" className="set-section" data-section="channels">
      <SectionHead s={SECTIONS[3]} help="DM·예약 인입 채널" />
      <div className="set-card">
        <div className="set-card-h">
          연결된 채널 6개{" "}
          <span className="small">· 모든 인입은 통합 인박스로 모입니다</span>
        </div>
        <div className="set-channels">
          {channels.map((c) => (
            <div key={c.key} className="set-channel">
              <div className={"set-channel-icon " + c.cls}>{c.letter}</div>
              <div className="set-channel-info">
                <div className="set-channel-name">
                  {c.name}
                  <span className={"set-channel-status " + c.status}>
                    <span className="dot" />
                    연결됨
                  </span>
                </div>
                <div className="set-channel-handle">{c.handle}</div>
              </div>
              <button className="set-btn sm">설정</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════ 05 결제 수단 ═════════ */
function PaymentsSection() {
  const methods = [
    {
      name: "신용카드 (국내)",
      detail: "토스페이먼츠 · KB국민·신한·삼성 외 11개",
      logo: "TOSS",
      fee: "2.9% + ₩50",
      default: true,
    },
    {
      name: "신용카드 (해외)",
      detail: "Stripe · Visa · Mastercard · AMEX",
      logo: "VISA",
      fee: "3.4% + ₩300",
      default: false,
    },
    {
      name: "카카오페이",
      detail: "QR 결제 · 정기 결제 미지원",
      logo: "KAKAO",
      fee: "2.5%",
      default: false,
    },
    {
      name: "현장 결제 (현금/카드)",
      detail: "수동 확인 · 영수증 자동 발행 안 됨",
      logo: "CASH",
      fee: "—",
      default: false,
    },
  ];
  return (
    <section id="payment" className="set-section" data-section="payment">
      <SectionHead
        s={SECTIONS[4]}
        help="고객이 예약 시 선택할 수 있는 결제 옵션"
      />
      <div className="set-card">
        <div className="set-card-h">
          활성 결제 수단
          <span className="small">· 수수료는 정산일 기준 자동 차감</span>
          <button className="set-btn sm" style={{ marginLeft: "auto" }}>
            ＋ 결제 수단 추가
          </button>
        </div>
        <div className="set-pm-list">
          {methods.map((m) => (
            <div key={m.name} className="set-pm">
              <div className="set-pm-logo">{m.logo}</div>
              <div className="set-pm-mid">
                <div className="set-pm-name">
                  {m.name}
                  {m.default && <span className="set-pm-default">기본</span>}
                </div>
                <div className="set-pm-detail">{m.detail}</div>
              </div>
              <div className="set-pm-fee">{m.fee}</div>
              <span className="set-toggle on" />
            </div>
          ))}
        </div>
        <div className="set-payout-summary">
          <div className="set-payout-stat">
            <div className="v">₩ 4,820,000</div>
            <div className="l">정산 대기 금액</div>
          </div>
          <div className="set-payout-stat">
            <div className="v">매주 화요일</div>
            <div className="l">자동 정산일</div>
          </div>
          <div className="set-payout-stat">
            <div className="v">국민 ****-2841</div>
            <div className="l">정산 계좌 · 박지민</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════ 06 알림 ═════════ */
function NotifSection() {
  const events = [
    {
      name: "신규 예약",
      desc: "고객이 예약을 완료했을 때",
      chans: { kakao: true, email: true, sms: false, push: true },
    },
    {
      name: "예약 변경·취소",
      desc: "예약 시간 변경 또는 취소",
      chans: { kakao: true, email: true, sms: true, push: true },
    },
    {
      name: "노쇼 의심",
      desc: "예약 시간 15분 경과 미도착",
      chans: { kakao: true, email: false, sms: false, push: true },
    },
    {
      name: "신규 DM 인입",
      desc: "Instagram·LINE·KakaoTalk DM",
      chans: { kakao: false, email: false, sms: false, push: true },
    },
    {
      name: "위험 키워드 감지",
      desc: "마사지·LED 등 약관 외 문구",
      chans: { kakao: true, email: true, sms: true, push: true },
    },
    {
      name: "리뷰 신규 등록",
      desc: "고객 리뷰 작성 시",
      chans: { kakao: false, email: true, sms: false, push: false },
    },
    {
      name: "정산 완료",
      desc: "주간 정산 입금 완료",
      chans: { kakao: true, email: true, sms: false, push: false },
    },
    {
      name: "약관·정책 업데이트",
      desc: "Hesya 약관 변경",
      chans: { kakao: false, email: true, sms: false, push: false },
    },
  ];
  return (
    <section id="notif" className="set-section" data-section="notif">
      <SectionHead
        s={SECTIONS[5]}
        help="알림은 박지민 (원장) 계정에 전달됩니다"
      />
      <div className="set-card">
        <div className="set-card-h">이벤트 × 채널 매트릭스</div>
        <table className="set-notif">
          <thead>
            <tr>
              <th>이벤트</th>
              <th>카카오</th>
              <th>이메일</th>
              <th>SMS</th>
              <th>앱 푸시</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.name}>
                <td>
                  {e.name}
                  <div className="desc">{e.desc}</div>
                </td>
                <td>
                  <span
                    className={"set-checkbox" + (e.chans.kakao ? " on" : "")}
                  />
                </td>
                <td>
                  <span
                    className={"set-checkbox" + (e.chans.email ? " on" : "")}
                  />
                </td>
                <td>
                  <span
                    className={"set-checkbox" + (e.chans.sms ? " on" : "")}
                  />
                </td>
                <td>
                  <span
                    className={"set-checkbox" + (e.chans.push ? " on" : "")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="set-card">
        <div className="set-card-h">
          방해 금지 시간{" "}
          <span className="small">· 매일 22:00 ~ 09:00 알림 음소거</span>
        </div>
        <Row label="시작 시각">
          <input
            className="set-time"
            defaultValue="22:00"
            style={{ width: 80 }}
          />
        </Row>
        <Row label="종료 시각">
          <input
            className="set-time"
            defaultValue="09:00"
            style={{ width: 80 }}
          />
        </Row>
        <Row
          label="긴급 알림 우회"
          hint="위험 키워드·예약 노쇼는 음소거 시간에도 전달."
        >
          <span className="set-toggle on" />
        </Row>
      </div>
    </section>
  );
}

/* ═════════ 07 요금제 ═════════ */
function PlanSection() {
  return (
    <section id="plan" className="set-section" data-section="plan">
      <SectionHead s={SECTIONS[6]} help="다음 결제일 2026-06-01" />
      <div className="set-plan">
        <div className="set-plan-current">
          <div className="set-plan-eyebrow">Current Plan</div>
          <div className="set-plan-name">Atelier</div>
          <div className="set-plan-name-kr">전문가 요금제</div>
          <div className="set-plan-price">
            ₩89,000<span className="unit">/월 · VAT 포함</span>
          </div>
          <div className="set-plan-features">
            <div className="li">디자이너 무제한 · 현재 5명 사용 중</div>
            <div className="li">DM 통합 인박스 · 5개 채널 연결</div>
            <div className="li">AI 사진 분석 월 200건</div>
            <div className="li">5개 언어 자동 번역 무제한</div>
            <div className="li">노쇼 보호 · 위험 키워드 감지</div>
            <div className="li">우선 지원 · 평일 09–18시</div>
          </div>
        </div>
        <div className="set-plan-usage">
          <h4>이번 달 사용량</h4>
          <div className="set-meter">
            <div className="set-meter-h">
              <span>AI 사진 분석</span>
              <span className="v">142 / 200</span>
            </div>
            <div className="set-meter-bar">
              <div className="set-meter-fill" style={{ width: "71%" }} />
            </div>
          </div>
          <div className="set-meter">
            <div className="set-meter-h">
              <span>SMS 발송</span>
              <span className="v">486 / 1,000</span>
            </div>
            <div className="set-meter-bar">
              <div className="set-meter-fill" style={{ width: "48.6%" }} />
            </div>
          </div>
          <div className="set-meter">
            <div className="set-meter-h">
              <span>예약 인입</span>
              <span className="v">312 / 무제한</span>
            </div>
            <div className="set-meter-bar">
              <div
                className="set-meter-fill"
                style={{ width: "100%", background: "var(--hesya-peach-200)" }}
              />
            </div>
          </div>
          <div className="set-meter">
            <div className="set-meter-h">
              <span>저장 공간</span>
              <span className="v">3.4 / 10 GB</span>
            </div>
            <div className="set-meter-bar">
              <div className="set-meter-fill" style={{ width: "34%" }} />
            </div>
          </div>
          <div className="set-billing-row">
            <span>다음 결제일 · 2026-06-01</span>
            <a
              href="#"
              style={{
                color: "var(--hesya-amber-600)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              요금제 변경 →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════ 08 보안 ═════════ */
function SecuritySection() {
  return (
    <section id="security" className="set-section" data-section="security">
      <SectionHead s={SECTIONS[7]} help="박지민 (원장) 계정 기준" />
      <div className="set-card">
        <div className="set-card-h">계정 보안</div>

        <div className="set-sec-row">
          <div className="set-sec-info">
            <div className="set-sec-title">비밀번호</div>
            <div className="set-sec-meta">
              최근 변경 · 2025-11-08 · 178일 전
            </div>
          </div>
          <button className="set-btn">변경</button>
        </div>

        <div className="set-sec-row">
          <div className="set-sec-info">
            <div className="set-sec-title">
              2단계 인증{" "}
              <span className="k-verified" style={{ marginLeft: 4 }}>
                활성
              </span>
            </div>
            <div className="set-sec-meta">
              SMS · 010-****-4815 · 권장: Authenticator 앱으로 업그레이드
            </div>
          </div>
          <button className="set-btn">설정</button>
        </div>

        <div className="set-sec-row">
          <div className="set-sec-info">
            <div className="set-sec-title">로그인 알림</div>
            <div className="set-sec-meta">
              새로운 기기·국가 로그인 시 카카오·이메일 통지
            </div>
          </div>
          <span className="set-toggle on" />
        </div>

        <div className="set-sec-row">
          <div className="set-sec-info">
            <div className="set-sec-title">국가 IP 제한</div>
            <div className="set-sec-meta">
              한국 외 접속 시 추가 인증 요구. 해외 출장 시 일시 해제 가능.
            </div>
          </div>
          <span className="set-toggle on" />
        </div>

        <div className="set-sessions">
          <div className="set-card-h" style={{ margin: 0 }}>
            활성 세션 3개 <span className="small">· 30일간 활동</span>
          </div>
          <div className="set-session">
            <span className="ic">🖥</span>
            <div>
              <div className="name">
                Chrome · macOS · 매장 데스크탑{" "}
                <span className="current">현재</span>
              </div>
              <div className="meta">서울 · 211.45.*.*</div>
            </div>
            <div></div>
            <span className="ago">방금</span>
          </div>
          <div className="set-session">
            <span className="ic">📱</span>
            <div>
              <div className="name">Hesya iOS · iPhone 15</div>
              <div className="meta">서울 · 박지민 모바일</div>
            </div>
            <button className="set-btn sm">로그아웃</button>
            <span className="ago">3시간 전</span>
          </div>
          <div className="set-session">
            <span className="ic">💻</span>
            <div>
              <div className="name">Safari · iPad · 매장 태블릿</div>
              <div className="meta">서울 · 211.45.*.*</div>
            </div>
            <button className="set-btn sm">로그아웃</button>
            <span className="ago">어제</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════ 09 위험 관리 ═════════ */
function RiskSection() {
  const clauses = [
    {
      title: "마사지·발마사지·스파 영업하지 않음",
      examples:
        "예: 두피 마사지(시술 부속 제외 단독 메뉴), 발 관리, 아로마 스파, 경락 등",
      sig: "kim.sj@stylista.kr",
      date: "2026-04-15 14:32 KST",
      ip: "211.45.*.*",
    },
    {
      title: "의료기기(LED·고주파·울쎄라·인모드) 사용하지 않음",
      examples:
        "예: LED 마스크, 고주파 두피기기, 울쎄라, 인모드, 미세전류 등 식약처 의료기기 인증 장비",
      sig: "kim.sj@stylista.kr",
      date: "2026-04-15 14:32 KST",
      ip: "211.45.*.*",
    },
    {
      title: "한방 시술 영업하지 않음",
      examples:
        "예: 한방 두피 케어, 한약재 팩, 침·뜸, 부항, 한의사 협진 등 한의약법 적용 시술",
      sig: "kim.sj@stylista.kr",
      date: "2026-04-15 14:32 KST",
      ip: "211.45.*.*",
    },
  ];
  return (
    <section id="risk" className="set-section" data-section="risk">
      <SectionHead
        s={SECTIONS[8]}
        help="법적 효력이 있는 자기신고 · 분기별 자동 검증"
      />
      <div className="set-risk-callout">
        <div className="set-risk-h">
          <div className="set-risk-seal">§</div>
          <div className="set-risk-titles">
            <div className="set-risk-title-kr">Hesya 약관 자기신고</div>
            <div className="set-risk-title-en">
              Self-Attested Compliance Declaration
            </div>
            <div className="set-risk-intro">
              본 매장은 <strong>「가. 일반미용업 — Hair General」</strong> 신고
              카테고리 안에서만 영업하며, 아래 세 가지 영역의 시술·기기·영업을
              제공하지 않음을 자율적으로 신고합니다. 신고 내용이 사실과 다를
              경우 Hesya 노출에서 즉시 제외되며, 관련 법령에 따른 책임은 매장에
              있습니다.
            </div>
          </div>
        </div>

        <div className="set-risk-list">
          {clauses.map((c, i) => (
            <div key={i} className="set-risk-item">
              <div className="set-risk-check">✓</div>
              <div className="set-risk-content">
                <div className="set-risk-clause">
                  {c.title}
                  <div className="examples">{c.examples}</div>
                </div>
                <div className="set-risk-meta">
                  <span>SIGNED</span>
                  <span className="sig">{c.sig}</span>
                  <span className="sep">·</span>
                  <span>{c.date}</span>
                  <span className="sep">·</span>
                  <span>IP {c.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="set-risk-foot">
          <div className="set-risk-caption">
            <strong>분기별 자동 재검증.</strong> 다음 재서명 요청은{" "}
            <span className="next">2026-07-15</span>에 자동 발송됩니다. 매장
            메뉴·DM·리뷰에서 해당 키워드가 감지되면 위 신고와 충돌 가능성을
            알려드립니다.
          </div>
          <button className="set-btn amber">재서명하기</button>
        </div>
      </div>

      <div className="set-danger">
        <div className="set-danger-h">⚠ 위험 영역</div>
        <div className="set-danger-row">
          <div className="set-danger-info">
            <div className="set-danger-title">매장 일시 비공개</div>
            <div className="set-danger-desc">
              고객 페이지 노출 중단. 진행 중 예약은 유지됩니다.
            </div>
          </div>
          <button className="set-btn">비공개 전환</button>
        </div>
        <div className="set-danger-row">
          <div className="set-danger-info">
            <div className="set-danger-title">매장 데이터 내보내기</div>
            <div className="set-danger-desc">
              예약·고객·메시지 데이터를 ZIP으로 다운로드. 7일간 링크 유효.
            </div>
          </div>
          <button className="set-btn">요청</button>
        </div>
        <div className="set-danger-row">
          <div className="set-danger-info">
            <div className="set-danger-title">매장 영구 삭제</div>
            <div className="set-danger-desc">
              모든 예약·고객·정산 기록이 삭제됩니다. 복구 불가. 진행 중 예약
              0건일 때만 가능.
            </div>
          </div>
          <button className="set-btn danger">삭제 요청</button>
        </div>
      </div>
    </section>
  );
}

/* ───────── App ───────── */
function App() {
  const [active, setActive] = stS("info");
  const scrollRef = stR(null);

  const onJump = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) {
      const top = el.offsetTop - 16;
      scrollRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  stE(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      const scrollTop = root.scrollTop + 100;
      let cur = "info";
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= scrollTop) cur = s.id;
      }
      setActive(cur);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hesya-shell" data-screen-label="01 Store Settings">
      <TopHeader />
      <div className="hesya-body">
        <SetNavSidebar />
        <main className="set-main">
          <SectionNav active={active} onJump={onJump} />
          <div className="set-scroll" ref={scrollRef}>
            <PageHeader />
            <StoreInfoSection />
            <HoursSection />
            <StaffSection />
            <ChannelsSection />
            <PaymentsSection />
            <NotifSection />
            <PlanSection />
            <SecuritySection />
            <RiskSection />
            <div className="set-bottom-spacer" />
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
