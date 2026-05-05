/* global React */
const { useState: pS, useEffect: pE } = React;

const PHOTOS = [
  {
    id: 1,
    customer: "사쿠라",
    flag: "🇯🇵",
    stylist: "민지",
    stylistInitial: "민",
    score: 94,
    status: "booked",
    h: 280,
    when: "12분 전",
    thickness: 0.52,
    technique: "포인트컷 + 슬라이드",
    portfolio: 7,
    tags: ["미디엄레이어드", "내추럴웨이브"],
    notes: "둥근 얼굴형 → 옆머리로 윤곽 보정",
    country: "Tokyo, Japan",
  },
  {
    id: 2,
    customer: "Linh Pham",
    flag: "🇻🇳",
    stylist: "현주",
    stylistInitial: "현",
    score: 89,
    status: "review",
    h: 240,
    when: "23분 전",
    thickness: 0.61,
    technique: "발레아쥬 + 톤다운",
    portfolio: 4,
    tags: ["허니브라운", "그라데이션"],
    notes: "검은 모발 → 자연스러운 명도 차이 추천",
    country: "Hanoi, Vietnam",
  },
  {
    id: 3,
    customer: "Wei Chen",
    flag: "🇨🇳",
    stylist: null,
    stylistInitial: null,
    score: 41,
    status: "failed",
    h: 220,
    when: "1시간 전",
    thickness: null,
    technique: null,
    portfolio: 0,
    tags: ["요청 모호"],
    notes: "참고 사진 + 텍스트 요청 일치도 낮음",
    country: "Beijing, China",
  },
  {
    id: 4,
    customer: "Emma Park",
    flag: "🇺🇸",
    stylist: "민지",
    stylistInitial: "민",
    score: 96,
    status: "booked",
    h: 320,
    when: "1시간 전",
    thickness: 0.48,
    technique: "C컬펌 + 트리트먼트",
    portfolio: 12,
    tags: ["S컬", "내추럴"],
    notes: "브라이덜 — 10월 결혼식 대비",
    country: "NYC, USA",
  },
  {
    id: 5,
    customer: "Yuki Tanaka",
    flag: "🇯🇵",
    stylist: "유진",
    stylistInitial: "유",
    score: 82,
    status: "booked",
    h: 260,
    when: "2시간 전",
    thickness: 0.55,
    technique: "단발 + 사이드뱅",
    portfolio: 5,
    tags: ["턱선단발"],
    notes: "직모 — 볼륨 매직 권장",
    country: "Osaka, Japan",
  },
  {
    id: 6,
    customer: "박서윤",
    flag: "🇰🇷",
    stylist: "소연",
    stylistInitial: "소",
    score: 91,
    status: "review",
    h: 230,
    when: "3시간 전",
    thickness: 0.58,
    technique: "롱레이어드",
    portfolio: 9,
    tags: ["긴머리", "S컬"],
    notes: "현재 길이 유지 + 결만 정리",
    country: "Seoul, Korea",
  },
  {
    id: 7,
    customer: "Mei Zhang",
    flag: "🇨🇳",
    stylist: "민지",
    stylistInitial: "민",
    score: 78,
    status: "review",
    h: 270,
    when: "5시간 전",
    thickness: 0.5,
    technique: "프리미엄 케어",
    portfolio: 3,
    tags: ["트리트먼트"],
    notes: "탈색 손상모 → 케어 우선",
    country: "Shanghai, China",
  },
  {
    id: 8,
    customer: "Camille D.",
    flag: "🇫🇷",
    stylist: null,
    stylistInitial: null,
    score: 38,
    status: "failed",
    h: 210,
    when: "6시간 전",
    thickness: null,
    technique: null,
    portfolio: 0,
    tags: ["사진 품질 낮음"],
    notes: "조명 부족 — 재촬영 요청 발송됨",
    country: "Paris, France",
  },
  {
    id: 9,
    customer: "정유나",
    flag: "🇰🇷",
    stylist: "현주",
    stylistInitial: "현",
    score: 95,
    status: "booked",
    h: 290,
    when: "어제",
    thickness: 0.62,
    technique: "컬러 보정 + 컷",
    portfolio: 11,
    tags: ["애쉬브라운"],
    notes: "VIP — 5년 단골",
    country: "Gangnam, Seoul",
    vip: true,
  },
  {
    id: 10,
    customer: "Aiko N.",
    flag: "🇯🇵",
    stylist: "유진",
    stylistInitial: "유",
    score: 86,
    status: "booked",
    h: 250,
    when: "어제",
    thickness: 0.53,
    technique: "C컬 매직",
    portfolio: 6,
    tags: ["볼륨매직"],
    notes: "C컬 + 시스루뱅",
    country: "Tokyo, Japan",
  },
  {
    id: 11,
    customer: "Hana Kim",
    flag: "🇺🇸",
    stylist: "소연",
    stylistInitial: "소",
    score: 84,
    status: "review",
    h: 220,
    when: "어제",
    thickness: 0.57,
    technique: "옴브레",
    portfolio: 5,
    tags: ["옴브레"],
    notes: "끝부분만 톤다운 — 손상 최소화",
    country: "LA, USA",
  },
  {
    id: 12,
    customer: "Ana Silva",
    flag: "🇧🇷",
    stylist: "민지",
    stylistInitial: "민",
    score: 79,
    status: "review",
    h: 280,
    when: "2일 전",
    thickness: 0.59,
    technique: "레이어드 + 인컬",
    portfolio: 4,
    tags: ["인컬", "레이어드"],
    notes: "곱슬모 — 텐션 컷 권장",
    country: "São Paulo, Brazil",
  },
];

const STYLIST_COLORS = {
  민: "var(--hesya-amber-500)",
  현: "#7AB6A1",
  유: "#9B8AC4",
  소: "#E8A0B0",
};

function Header({ filter, setFilter }) {
  const filters = [
    { id: "latest", kr: "최신", n: 142 },
    { id: "failed", kr: "매칭 실패", n: 18 },
    { id: "vip", kr: "VIP만", n: 12 },
  ];
  return (
    <div className="ph-header">
      <div className="ph-header-l">
        <h1 className="ph-title kr-display">AI 사진 분석</h1>
        <div className="ph-stats">
          <span className="kr">
            이번 주 분석 <strong className="mono">142</strong>건
          </span>
          <span className="ph-stats-sep" />
          <span className="kr">
            매칭 성공 <strong className="mono">124</strong>건
          </span>
          <span className="ph-success-pill">87%</span>
        </div>
      </div>
      <div className="ph-header-r">
        <div className="ph-filter-chips">
          {filters.map((f) => (
            <button
              key={f.id}
              className={"ph-chip" + (filter === f.id ? " active" : "")}
              onClick={() => setFilter(f.id)}
            >
              <span className="kr">{f.kr}</span>
              <span className="ph-chip-n mono">{f.n}</span>
            </button>
          ))}
        </div>
        <button className="ph-icon-btn" title="설정">
          ⚙
        </button>
      </div>
    </div>
  );
}

function PhotoTile({ p, selected, onClick }) {
  const stylistColor = p.stylist
    ? STYLIST_COLORS[p.stylistInitial]
    : "var(--gray-300)";
  const statusMap = {
    booked: { icon: "✓", kr: "예약 완료", cls: "booked" },
    review: { icon: "◷", kr: "검토 중", cls: "review" },
    failed: { icon: "✕", kr: "매칭 실패", cls: "failed" },
  };
  const status = statusMap[p.status];

  // Generate placeholder photo as gradient
  const photoBg =
    p.status === "failed"
      ? `linear-gradient(${135 + p.id * 30}deg, var(--gray-200), var(--gray-300))`
      : `linear-gradient(${135 + p.id * 30}deg, var(--hesya-peach-200), var(--hesya-amber-500))`;

  return (
    <div
      className={
        "ph-tile" +
        (selected ? " selected" : "") +
        (p.status === "failed" ? " is-failed" : "")
      }
      onClick={() => onClick(p)}
      style={{ height: p.h }}
    >
      <div className="ph-tile-photo" style={{ background: photoBg }}>
        {p.stylist && (
          <div
            className="ph-tile-stylist"
            style={{ background: stylistColor }}
            title={`매칭: ${p.stylist} 디자이너`}
          >
            {p.stylistInitial}
          </div>
        )}
        {!p.stylist && (
          <div
            className="ph-tile-stylist ph-tile-no-stylist"
            title="매칭 디자이너 없음"
          >
            ?
          </div>
        )}
        {p.vip && <span className="ph-tile-vip">★ VIP</span>}
        <div className="ph-tile-when kr">{p.when}</div>
      </div>
      <div className="ph-tile-foot">
        <div className="ph-tile-customer">
          <span className="ph-tile-flag">{p.flag}</span>
          <span className="ph-tile-name kr-display">{p.customer}</span>
        </div>
        <div className="ph-tile-meta">
          <span className={"ph-tile-status " + status.cls}>
            <span className="ph-tile-status-icon">{status.icon}</span>
            <span className="kr">{status.kr}</span>
          </span>
          {p.score != null && (
            <span
              className={
                "ph-tile-score " +
                (p.score >= 80 ? "good" : p.score >= 60 ? "mid" : "low")
              }
            >
              <span className="mono">{p.score}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoGrid({ selected, onSelect, filter }) {
  const filtered = PHOTOS.filter((p) => {
    if (filter === "failed") return p.status === "failed";
    if (filter === "vip") return p.vip;
    return true;
  });
  // Distribute into 4 columns by index
  const cols = [[], [], [], []];
  filtered.forEach((p, i) => cols[i % 4].push(p));

  return (
    <div className="ph-grid-wrap">
      <div className="ph-grid-toolbar">
        <span className="kr ph-grid-count">
          {filtered.length}건 표시 · 평균 신뢰도{" "}
          <strong className="mono">82</strong>
        </span>
        <div className="ph-grid-toolbar-r">
          <button className="ph-mini-toggle active kr">그리드</button>
          <button className="ph-mini-toggle kr">리스트</button>
        </div>
      </div>
      <div className="ph-grid">
        {cols.map((col, ci) => (
          <div key={ci} className="ph-grid-col">
            {col.map((p) => (
              <PhotoTile
                key={p.id}
                p={p}
                selected={selected?.id === p.id}
                onClick={onSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ photo }) {
  const [accordionOpen, setAccordionOpen] = pS(false);
  if (!photo) return null;

  const isFailed = photo.status === "failed";
  const stylistColor = photo.stylist
    ? STYLIST_COLORS[photo.stylistInitial]
    : "var(--gray-300)";
  const photoBg = isFailed
    ? `linear-gradient(135deg, var(--gray-200), var(--gray-300))`
    : `linear-gradient(${135 + photo.id * 30}deg, var(--hesya-peach-200), var(--hesya-amber-500))`;

  return (
    <div className="ph-detail">
      <div className="ph-detail-head">
        <div className="ph-detail-customer">
          <span className="ph-detail-flag">{photo.flag}</span>
          <div>
            <div className="ph-detail-name kr-display">{photo.customer}</div>
            <div className="ph-detail-loc">
              {photo.country} · {photo.when}
            </div>
          </div>
        </div>
        <button className="ph-detail-close" title="닫기">
          ×
        </button>
      </div>

      <div className="ph-detail-photo" style={{ background: photoBg }}>
        <div className="ph-detail-photo-overlay">
          <span className="ph-detail-photo-label kr">
            손님이 업로드한 참고 사진
          </span>
          <span className="ph-detail-photo-meta">
            2.4MB · 1080×1080 · iPhone 14
          </span>
        </div>
        {!isFailed && (
          <div className="ph-detail-score-ring">
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="#FFF"
                strokeWidth="4"
                strokeDasharray={`${(2 * Math.PI * 26 * photo.score) / 100} ${2 * Math.PI * 26}`}
                strokeDashoffset={2 * Math.PI * 26 * 0.25}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </svg>
            <div className="ph-detail-score-num">
              <strong className="mono">{photo.score}</strong>
              <span>신뢰도</span>
            </div>
          </div>
        )}
      </div>

      {isFailed ? (
        <div className="ph-failed-block">
          <div className="ph-failed-icon">⚠</div>
          <h3 className="kr-display">매칭에 실패했어요</h3>
          <p className="kr ph-failed-reason">
            사진 품질이 낮거나 요청 텍스트와 일치도가 낮습니다. 손님에게 추가
            사진을 요청하거나 직접 채팅으로 안내해주세요.
          </p>
          <div className="ph-failed-reasons">
            <div className="ph-failed-row">
              <span className="kr ph-failed-row-l">사진 품질</span>
              <div className="ph-failed-bar">
                <div
                  className="ph-failed-bar-fill"
                  style={{ width: "32%", background: "var(--semantic-danger)" }}
                />
              </div>
              <span className="mono">32</span>
            </div>
            <div className="ph-failed-row">
              <span className="kr ph-failed-row-l">요청 일치도</span>
              <div className="ph-failed-bar">
                <div
                  className="ph-failed-bar-fill"
                  style={{
                    width: "44%",
                    background: "var(--semantic-warning)",
                  }}
                />
              </div>
              <span className="mono">44</span>
            </div>
            <div className="ph-failed-row">
              <span className="kr ph-failed-row-l">디자이너 매칭</span>
              <div className="ph-failed-bar">
                <div
                  className="ph-failed-bar-fill"
                  style={{ width: "16%", background: "var(--semantic-danger)" }}
                />
              </div>
              <span className="mono">16</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="ph-audit">
            <div className="ph-audit-head">
              <h3 className="kr-display">AI는 왜 이 디자이너를 추천했나요?</h3>
              <div className="ph-audit-tag kr">투명 분석</div>
            </div>

            <div className="ph-audit-bullets">
              <div className="ph-audit-bullet">
                <div className="ph-audit-num mono">01</div>
                <div className="ph-audit-body">
                  <div className="ph-audit-label kr">모발 두께 분석</div>
                  <div className="ph-audit-value">
                    <span className="kr">중간–얇음</span>
                    <span className="ph-audit-ratio">
                      <span className="mono">
                        ratio {photo.thickness?.toFixed(2)}
                      </span>
                      <span className="ph-audit-bar">
                        <span
                          className="ph-audit-bar-fill"
                          style={{ width: `${(photo.thickness || 0) * 100}%` }}
                        />
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ph-audit-bullet">
                <div className="ph-audit-num mono">02</div>
                <div className="ph-audit-body">
                  <div className="ph-audit-label kr">필요 컷 기법</div>
                  <div className="ph-audit-value">
                    <span className="kr ph-audit-tech">{photo.technique}</span>
                    <span className="ph-audit-tech-sub kr">
                      — 모발 두께·길이에 가장 적합한 기법 조합
                    </span>
                  </div>
                </div>
              </div>

              <div className="ph-audit-bullet">
                <div className="ph-audit-num mono">03</div>
                <div className="ph-audit-body">
                  <div className="ph-audit-label kr">
                    디자이너 포트폴리오 매칭
                  </div>
                  <div className="ph-audit-value">
                    <span
                      className="kr-display ph-audit-stylist"
                      style={{ color: stylistColor }}
                    >
                      <span
                        className="ph-audit-stylist-dot"
                        style={{ background: stylistColor }}
                      />
                      김{photo.stylist} 디자이너
                    </span>
                    <span className="kr ph-audit-stylist-sub">
                      유사 작품{" "}
                      <strong className="mono">{photo.portfolio}건</strong>
                    </span>
                  </div>
                  <div className="ph-portfolio-strip">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className="ph-portfolio-tile"
                        style={{
                          background: `linear-gradient(${45 + i * 30}deg, var(--hesya-peach-100), var(--hesya-amber-500))`,
                        }}
                      >
                        <span className="ph-portfolio-i mono">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              className={"ph-accordion" + (accordionOpen ? " open" : "")}
              onClick={() => setAccordionOpen(!accordionOpen)}
            >
              <span className="kr">원본 분석 데이터 보기</span>
              <span className="ph-accordion-meta kr">
                vision tokens · 카테고리 raw
              </span>
              <span className="ph-accordion-caret">
                {accordionOpen ? "▾" : "▸"}
              </span>
            </button>

            {accordionOpen && (
              <div className="ph-accordion-body">
                <div className="ph-raw-block">
                  <div className="ph-raw-head kr">Vision Tokens (상위 12)</div>
                  <div className="ph-raw-tokens">
                    {[
                      ["hair_length", "shoulder", 0.91],
                      ["hair_thickness", "medium-fine", 0.87],
                      ["face_shape", "oval", 0.82],
                      ["skin_undertone", "warm", 0.79],
                      ["color_current", "natural-black-1", 0.94],
                      ["color_target", "ash-brown-6", 0.71],
                      ["style_intent", "natural-wave", 0.68],
                      ["volume_target", "soft-medium", 0.66],
                      ["bang_style", "side-swept", 0.63],
                      ["damage_level", "low", 0.81],
                      ["pattern_curl", "1A-straight", 0.88],
                      ["lighting_quality", "good", 0.85],
                    ].map(([k, v, c], i) => (
                      <div key={i} className="ph-raw-token">
                        <span className="ph-raw-k mono">{k}</span>
                        <span className="ph-raw-v mono">{v}</span>
                        <span className="ph-raw-c mono">{c.toFixed(2)}</span>
                        <span className="ph-raw-bar">
                          <span
                            className="ph-raw-bar-f"
                            style={{ width: `${c * 100}%` }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ph-raw-block">
                  <div className="ph-raw-head kr">카테고리 분류 (raw)</div>
                  <pre className="ph-raw-json mono">{`{
  "service_category": "color+cut",
  "estimated_duration_min": 200,
  "estimated_price_won": 280000,
  "stylist_pool": ["민지", "유진"],
  "matched": "민지",
  "match_reasoning": [
    "portfolio_overlap: 0.87",
    "korean_jp_proficiency: native",
    "schedule_match: same-day"
  ],
  "warnings": []
}`}</pre>
                </div>
                <div className="ph-raw-foot kr">
                  ⚙ 이 데이터는 손님에게 보이지 않습니다 · 매장 운영자 전용
                </div>
              </div>
            )}
          </div>

          <div className="ph-action-panel">
            <div className="ph-action-note">
              <span className="kr">{photo.notes}</span>
            </div>
            <div className="ph-action-row">
              <button className="ph-act-primary kr">
                <span>이 손님과 채팅</span>
                <span className="ph-act-arrow">→</span>
              </button>
              <button className="ph-act-ghost kr">
                <span>다른 디자이너 추천</span>
                <span className="ph-act-arrow">→</span>
              </button>
            </div>
            <div className="ph-action-meta kr">
              <span>조정 시 AI는 이 결정을 학습합니다</span>
              <span className="ph-action-meta-sep" />
              <span>
                매칭 ID <span className="mono">#A-{1000 + photo.id}</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

window.HesyaPhotoParts = { Header, PhotoGrid, DetailPanel, PHOTOS };
