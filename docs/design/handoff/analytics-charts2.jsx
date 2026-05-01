/* global React */
const { useFadeIn: aUF, HESYA_COLORS: HC } = window.HesyaAnPart1;

// ─── Heatmap ─────────────────────────────────────────────
function Heatmap() {
  const [ref, visible] = aUF();
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const hours = [
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
  ];

  // Data: rows=days, cols=hours, values 0-100 (booking density of foreign customers)
  const data = [
    [4, 8, 12, 18, 22, 24, 18, 14, 10, 6, 3], // 월
    [6, 12, 18, 28, 56, 64, 42, 24, 18, 10, 4], // 화 — JP 14-16 peak
    [8, 14, 22, 32, 38, 36, 28, 22, 16, 8, 4], // 수
    [10, 16, 24, 34, 72, 78, 54, 32, 22, 12, 6], // 목 — JP 14-16 peak
    [12, 18, 28, 38, 48, 52, 44, 36, 28, 18, 10], // 금
    [22, 32, 48, 64, 86, 92, 88, 72, 58, 42, 28], // 토 — peak
    [18, 26, 38, 52, 68, 76, 72, 58, 44, 30, 18], // 일
  ];

  const cell = (v) => {
    if (v === 0) return "transparent";
    const opacity = Math.min(1, v / 100 + 0.08);
    return `rgba(232, 169, 122, ${opacity})`;
  };

  return (
    <div
      ref={ref}
      className={"an-card span-6" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "200ms" }}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">요일·시간 외국인 예약 밀도</h3>
          <p className="an-card-sub kr">진한 색일수록 예약이 많은 시간대</p>
        </div>
        <div className="an-heat-scale">
          <span className="kr">적음</span>
          <div className="an-heat-scale-track">
            {[0.15, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
              <span
                key={i}
                className="an-heat-scale-cell"
                style={{ background: `rgba(232, 169, 122, ${o})` }}
              />
            ))}
          </div>
          <span className="kr">많음</span>
        </div>
      </div>
      <div className="an-card-body">
        <div className="an-heatmap">
          <div className="an-heat-corner" />
          {hours.map((h) => (
            <div key={h} className="an-heat-col-label mono">
              {h}
            </div>
          ))}
          {days.map((d, di) => (
            <React.Fragment key={d}>
              <div className="an-heat-row-label kr">{d}</div>
              {data[di].map((v, hi) => (
                <div
                  key={hi}
                  className={"an-heat-cell" + (v > 70 ? " hot" : "")}
                  style={{ background: cell(v) }}
                  title={`${d}요일 ${hours[hi]}시 · ${v}건`}
                >
                  {v > 70 && <span className="an-heat-cell-v mono">{v}</span>}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="an-heat-foot kr">
          <span>
            🔥 화·목 14:00–16:00 일본인 손님 집중 — 디자이너 추가 배치 권장
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────
function Funnel() {
  const [ref, visible] = aUF();
  const stages = [
    { kr: "DM 받음", en: "Inbox", v: 348, color: HC.navy, drop: null },
    { kr: "예약 확정", en: "Booked", v: 218, color: HC.amberDark, drop: 37 },
    { kr: "결제 완료", en: "Paid", v: 196, color: HC.amber, drop: 10 },
    { kr: "후기 등록", en: "Review", v: 142, color: HC.sage, drop: 28 },
  ];
  const max = stages[0].v;

  return (
    <div
      ref={ref}
      className={"an-card span-8" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "250ms" }}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">DM → 예약 → 결제 → 후기 전환율</h3>
          <p className="an-card-sub kr">최근 30일 외국인 손님 기준</p>
        </div>
        <div className="an-funnel-overall kr">
          <span>전체 전환율</span>
          <strong className="mono">40.8%</strong>
        </div>
      </div>
      <div className="an-card-body an-funnel-body">
        {stages.map((s, i) => {
          const w = (s.v / max) * 100;
          return (
            <div key={i} className="an-funnel-stage">
              <div className="an-funnel-meta">
                <div className="an-funnel-label">
                  <span className="an-funnel-num mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="kr-display">{s.kr}</span>
                  <span className="an-funnel-en">{s.en}</span>
                </div>
                {s.drop != null && (
                  <div className="an-funnel-drop">
                    <span className="an-funnel-drop-arr">↓</span>
                    <span className="kr">이탈</span>
                    <span className="mono">{s.drop}%</span>
                  </div>
                )}
              </div>
              <div className="an-funnel-bar-wrap">
                <div
                  className="an-funnel-bar"
                  style={{
                    width: `${w}%`,
                    background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}EE 100%)`,
                  }}
                >
                  <span className="an-funnel-bar-v mono">{s.v}</span>
                  <span className="an-funnel-bar-pct mono">
                    {((s.v / max) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cohort table ────────────────────────────────────────
function CohortTable() {
  const [ref, visible] = aUF();
  const cohorts = [
    { month: "9월", n: 22, vals: [100, 64, 41, 32, 27, 22] },
    { month: "10월", n: 28, vals: [100, 71, 46, 38, 32, null] },
    { month: "11월", n: 24, vals: [100, 67, 50, 42, null, null] },
    { month: "12월", n: 31, vals: [100, 74, 55, null, null, null] },
    { month: "1월", n: 26, vals: [100, 69, null, null, null, null] },
    { month: "2월", n: 29, vals: [100, null, null, null, null, null] },
  ];

  const cellColor = (v) => {
    if (v == null) return "var(--gray-50)";
    if (v >= 70) return "rgba(232, 169, 122, 0.85)";
    if (v >= 50) return "rgba(232, 169, 122, 0.55)";
    if (v >= 30) return "rgba(232, 169, 122, 0.3)";
    return "rgba(232, 169, 122, 0.12)";
  };
  const cellTextColor = (v) =>
    v != null && v >= 50 ? "#FFF" : "var(--hesya-navy-900)";

  return (
    <div
      ref={ref}
      className={"an-card span-4" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "300ms" }}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">월별 신규 고객 재방문률</h3>
          <p className="an-card-sub kr">코호트 분석 (외국인)</p>
        </div>
      </div>
      <div className="an-card-body">
        <div className="an-cohort">
          <div className="an-cohort-head">
            <div className="an-cohort-h kr">월</div>
            <div className="an-cohort-h kr">신규</div>
            {[1, 2, 3, 4, 5].map((m) => (
              <div key={m} className="an-cohort-h mono">
                M+{m}
              </div>
            ))}
          </div>
          {cohorts.map((c) => (
            <div key={c.month} className="an-cohort-row">
              <div className="an-cohort-month kr">{c.month}</div>
              <div className="an-cohort-n mono">{c.n}</div>
              {c.vals.slice(1).map((v, i) => (
                <div
                  key={i}
                  className="an-cohort-cell mono"
                  style={{ background: cellColor(v), color: cellTextColor(v) }}
                >
                  {v != null ? `${v}%` : "—"}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="an-cohort-foot kr">
          <span>평균 재방문률 (M+1)</span>
          <strong className="mono">69%</strong>
        </div>
      </div>
    </div>
  );
}

// ─── Insight Band ────────────────────────────────────────
function InsightBand() {
  const [ref, visible] = aUF();
  return (
    <div
      ref={ref}
      className={"an-insight" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "350ms" }}
    >
      <div className="an-insight-l">
        <div className="an-insight-icon">💡</div>
        <div className="an-insight-text">
          <div className="an-insight-eyebrow kr">AI 인사이트 · 이번 주</div>
          <p className="kr">
            <strong>
              일본인 손님은 화·목 14:00–16:00에 가장 많이 예약해요.
            </strong>{" "}
            이 시간대 매칭률은 <strong className="mono">94%</strong>로 평균 대비
            +28%p 높습니다. 디자이너 한 명을 추가 배치하면 주당 약{" "}
            <strong className="mono">₩680,000</strong>의 추가 매출이 예상됩니다.
          </p>
          <div className="an-insight-data">
            <span className="kr">근거 데이터:</span>
            <span className="an-insight-data-chip kr">화 14–16시 56건</span>
            <span className="an-insight-data-chip kr">목 14–16시 78건</span>
            <span className="an-insight-data-chip kr">전환율 92%</span>
          </div>
        </div>
      </div>
      <div className="an-insight-r">
        <button className="an-insight-secondary kr">
          <span>인사이트 닫기</span>
        </button>
        <button className="an-insight-primary kr">
          <span>예약 캘린더 보기</span>
          <span className="an-insight-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

window.HesyaAnPart2 = { Heatmap, Funnel, CohortTable, InsightBand };
