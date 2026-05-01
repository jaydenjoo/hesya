/* global React */
const { useState: aS, useEffect: aE, useRef: aR } = React;

// Hook: lazy fade-in observer
function useFadeIn() {
  const ref = aR(null);
  const [visible, setVisible] = aS(false);
  aE(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const HESYA_COLORS = {
  navy: "#1A2238",
  amber: "#E8A97A",
  amberDark: "#D88B5B",
  peach: "#F5DDC8",
  peachLight: "#F8E9D9",
  cream: "#FDF8F1",
  // analytical pastels
  sage: "#9DB89D",
  sky: "#A4B8D1",
  rose: "#E5A8B0",
  lilac: "#B8A8C9",
  mint: "#A8C9B5",
  sand: "#D4BFA0",
};

function AnalyticsHeader({ period, setPeriod }) {
  const periods = [
    { id: "day", kr: "일" },
    { id: "week", kr: "주" },
    { id: "month", kr: "월" },
    { id: "quarter", kr: "분기" },
  ];
  return (
    <div className="an-header">
      <div className="an-header-l">
        <h1 className="an-title kr-display">매출 & 통계</h1>
        <div className="an-period-row">
          <div className="an-period-toggle">
            {periods.map((p) => (
              <button
                key={p.id}
                className={"an-pt-btn" + (period === p.id ? " active" : "")}
                onClick={() => setPeriod(p.id)}
              >
                <span className="kr">{p.kr}</span>
                {p.id === "month" && <span className="an-pt-star">★</span>}
              </button>
            ))}
          </div>
          <div className="an-date-range">
            <span className="kr">2024.03.01</span>
            <span className="an-date-arrow">→</span>
            <span className="kr">2024.03.31</span>
            <span className="an-date-caret">▾</span>
          </div>
          <span className="an-compare kr">전월 대비</span>
        </div>
      </div>
      <div className="an-header-r">
        <button className="an-icon-btn" title="새로고침">
          ↻
        </button>
        <button className="an-pdf-btn kr">
          <span>보고서 PDF 다운로드</span>
          <span className="an-pdf-arrow">↓</span>
        </button>
      </div>
    </div>
  );
}

function KPITile({
  label,
  value,
  unit,
  sub,
  trend,
  trendValue,
  accent,
  n,
  children,
}) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      className={"an-kpi" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: `${n * 60}ms` }}
    >
      <div className="an-kpi-head">
        <span className="an-kpi-label kr">{label}</span>
        {accent && <span className="an-kpi-accent">{accent}</span>}
      </div>
      <div className="an-kpi-value-row">
        <span className="an-kpi-value mono">{value}</span>
        {unit && <span className="an-kpi-unit kr">{unit}</span>}
      </div>
      {sub && (
        <div className="an-kpi-sub">
          {trend && (
            <span
              className={
                "an-kpi-trend " +
                (trend === "up" ? "up" : trend === "down" ? "down" : "neutral")
              }
            >
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {trendValue}
            </span>
          )}
          <span className="an-kpi-sub-text kr">{sub}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function KPIRow() {
  return (
    <div className="an-kpi-row">
      <KPITile
        n={0}
        label="총 매출 (이번 달)"
        value="₩18,420,000"
        trend="up"
        trendValue="24%"
        sub="전월 대비"
      >
        <Sparkline color={HESYA_COLORS.navy} />
      </KPITile>
      <KPITile
        n={1}
        label="외국인 매출"
        value="₩7,360,000"
        accent={
          <span className="an-kpi-share kr">
            전체의 <strong className="mono">40%</strong>
          </span>
        }
        trend="up"
        trendValue="38%"
        sub="MoM"
      >
        <ShareBar share={40} />
      </KPITile>
      <KPITile
        n={2}
        label="외국인 평균 객단가"
        value="₩116,800"
        trend="up"
        trendValue="11%"
        sub="vs 한국인 ₩94,200"
      >
        <Sparkline color={HESYA_COLORS.amberDark} />
      </KPITile>
      <KPITile
        n={3}
        label="신규 외국인 손님"
        value="31"
        unit="명"
        sub="목표 50명까지 19명"
      >
        <ProgressRing pct={62} />
      </KPITile>
    </div>
  );
}

function Sparkline({ color }) {
  const data = [12, 15, 13, 18, 17, 21, 19, 24, 22, 28, 26, 31];
  const max = Math.max(...data);
  const w = 240,
    h = 28;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg
      className="an-spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <polygon points={areaPts} fill={color} opacity="0.08" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareBar({ share }) {
  return (
    <div className="an-sharebar">
      <div className="an-sharebar-track">
        <div className="an-sharebar-fill" style={{ width: `${share}%` }} />
      </div>
      <div className="an-sharebar-meta">
        <span className="kr">외국인</span>
        <span className="kr">한국인</span>
      </div>
    </div>
  );
}

function ProgressRing({ pct }) {
  const r = 16,
    c = 2 * Math.PI * r;
  return (
    <div className="an-pring">
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--hesya-peach-100)"
          strokeWidth="3.5"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--hesya-amber-500)"
          strokeWidth="3.5"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="an-pring-pct mono">{pct}%</span>
    </div>
  );
}

// ─── Line chart ─────────────────────────────────────────
function LineChart() {
  const [ref, visible] = useFadeIn();
  const w = 720,
    h = 220;
  const padL = 50,
    padR = 16,
    padT = 16,
    padB = 30;
  const innerW = w - padL - padR,
    innerH = h - padT - padB;
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  const korean = [380, 420, 510, 480, 590, 720, 540];
  const foreign = [180, 240, 380, 420, 360, 480, 320];
  const max = 800;

  const path = (data, color, dashed) => {
    const pts = data.map((v, i) => {
      const x = padL + (i / (data.length - 1)) * innerW;
      const y = padT + innerH - (v / max) * innerH;
      return `${x},${y}`;
    });
    return (
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "0" : "0"}
      />
    );
  };

  const area = (data, color) => {
    const pts = data.map((v, i) => {
      const x = padL + (i / (data.length - 1)) * innerW;
      const y = padT + innerH - (v / max) * innerH;
      return `${x},${y}`;
    });
    const areaPath = `${padL},${padT + innerH} ${pts.join(" ")} ${padL + innerW},${padT + innerH}`;
    return <polygon points={areaPath} fill={color} opacity="0.1" />;
  };

  const dots = (data, color) =>
    data.map((v, i) => {
      const x = padL + (i / (data.length - 1)) * innerW;
      const y = padT + innerH - (v / max) * innerH;
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 5 ? 5 : 3}
          fill="#FFF"
          stroke={color}
          strokeWidth="2"
        />
      );
    });

  return (
    <div
      ref={ref}
      className={"an-card span-8" + (visible ? " is-visible" : "")}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">주간 매출 추이</h3>
          <p className="an-card-sub kr">한국인 vs 외국인 매출 (단위: 만원)</p>
        </div>
        <div className="an-legend">
          <span className="an-legend-it">
            <span
              className="an-legend-dot"
              style={{ background: HESYA_COLORS.navy }}
            />
            <span className="kr">한국인</span>
          </span>
          <span className="an-legend-it">
            <span
              className="an-legend-dot"
              style={{ background: HESYA_COLORS.amber }}
            />
            <span className="kr">외국인</span>
          </span>
        </div>
      </div>
      <div className="an-card-body">
        <svg viewBox={`0 0 ${w} ${h}`} className="an-line-svg">
          {[0, 200, 400, 600, 800].map((v) => {
            const y = padT + innerH - (v / max) * innerH;
            return (
              <g key={v}>
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + innerW}
                  y2={y}
                  stroke="var(--hesya-peach-100)"
                  strokeWidth="1"
                  strokeDasharray={v === 0 ? "0" : "2 4"}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--gray-500)"
                  fontFamily="var(--font-mono)"
                >
                  {v}
                </text>
              </g>
            );
          })}
          {labels.map((lab, i) => {
            const x = padL + (i / (labels.length - 1)) * innerW;
            return (
              <text
                key={i}
                x={x}
                y={h - 10}
                textAnchor="middle"
                fontSize="11"
                fill="var(--gray-600)"
              >
                {lab}
              </text>
            );
          })}
          {area(korean, HESYA_COLORS.navy)}
          {area(foreign, HESYA_COLORS.amber)}
          {path(korean, HESYA_COLORS.navy)}
          {path(foreign, HESYA_COLORS.amber)}
          {dots(korean, HESYA_COLORS.navy)}
          {dots(foreign, HESYA_COLORS.amber)}
          {/* Highlight Saturday peak */}
          <g>
            <line
              x1={padL + (5 / 6) * innerW}
              y1={padT}
              x2={padL + (5 / 6) * innerW}
              y2={padT + innerH}
              stroke="var(--hesya-amber-500)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          </g>
        </svg>
      </div>
      <div className="an-card-foot kr">
        <span>
          📈 토요일 외국인 매출 <strong className="mono">+34%</strong> — 주말
          트래픽 정점
        </span>
      </div>
    </div>
  );
}

// ─── Donut ──────────────────────────────────────────────
function DonutChart() {
  const [ref, visible] = useFadeIn();
  const data = [
    { kr: "일본", flag: "🇯🇵", v: 38, color: HESYA_COLORS.amber },
    { kr: "중국", flag: "🇨🇳", v: 24, color: HESYA_COLORS.navy },
    { kr: "미국", flag: "🇺🇸", v: 16, color: HESYA_COLORS.sage },
    { kr: "베트남", flag: "🇻🇳", v: 11, color: HESYA_COLORS.lilac },
    { kr: "기타", flag: "🌍", v: 11, color: HESYA_COLORS.peach },
  ];
  const total = data.reduce((s, d) => s + d.v, 0);
  const cx = 75,
    cy = 75,
    r = 58,
    sw = 22;
  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const sweep = (d.v / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={d.color}
        strokeWidth={sw}
      />
    );
  });

  return (
    <div
      ref={ref}
      className={"an-card span-4" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">국적별 매출</h3>
          <p className="an-card-sub kr">이번 달 외국인 매출</p>
        </div>
      </div>
      <div className="an-card-body an-donut-body">
        <div className="an-donut-svg-wrap">
          <svg viewBox="0 0 150 150" width="150" height="150">
            {arcs}
          </svg>
          <div className="an-donut-center">
            <div className="an-donut-center-v mono">₩7.36M</div>
            <div className="an-donut-center-l kr">외국인 합계</div>
          </div>
        </div>
        <div className="an-donut-legend">
          {data.map((d, i) => (
            <div key={i} className="an-donut-row">
              <span className="an-donut-row-flag">{d.flag}</span>
              <span className="an-donut-row-name kr">{d.kr}</span>
              <span className="an-donut-row-bar">
                <span
                  className="an-donut-row-bar-fill"
                  style={{ width: `${d.v}%`, background: d.color }}
                />
              </span>
              <span className="an-donut-row-pct mono">{d.v}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stacked bar ────────────────────────────────────────
function StackedBar() {
  const [ref, visible] = useFadeIn();
  const stylists = [
    {
      name: "민지",
      initial: "민",
      jp: 980,
      cn: 420,
      en: 280,
      vn: 90,
      color: HESYA_COLORS.amber,
    },
    {
      name: "현주",
      initial: "현",
      jp: 580,
      cn: 320,
      en: 480,
      vn: 120,
      color: HESYA_COLORS.sage,
    },
    {
      name: "유진",
      initial: "유",
      jp: 320,
      cn: 180,
      en: 360,
      vn: 80,
      color: HESYA_COLORS.lilac,
    },
    {
      name: "소연",
      initial: "소",
      jp: 180,
      cn: 240,
      en: 120,
      vn: 40,
      color: HESYA_COLORS.rose,
    },
    {
      name: "지훈",
      initial: "지",
      jp: 60,
      cn: 80,
      en: 40,
      vn: 20,
      color: HESYA_COLORS.sky,
    },
  ];
  const max = 2000;

  return (
    <div
      ref={ref}
      className={"an-card span-6" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: "150ms" }}
    >
      <div className="an-card-head">
        <div>
          <h3 className="kr-display">디자이너별 외국인 매출</h3>
          <p className="an-card-sub kr">국적별 누적 (단위: 만원)</p>
        </div>
        <div className="an-legend an-legend-sm">
          {[
            ["일본", HESYA_COLORS.amber],
            ["중국", HESYA_COLORS.navy],
            ["영어권", HESYA_COLORS.sage],
            ["기타", HESYA_COLORS.peach],
          ].map(([k, c], i) => (
            <span key={i} className="an-legend-it">
              <span className="an-legend-sq" style={{ background: c }} />
              <span className="kr">{k}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="an-card-body">
        <div className="an-stacked-list">
          {stylists.map((s, i) => {
            const total = s.jp + s.cn + s.en + s.vn;
            const totalPct = (total / max) * 100;
            return (
              <div key={i} className="an-stacked-row">
                <div className="an-stacked-name">
                  <span
                    className="an-stacked-avatar"
                    style={{ background: s.color }}
                  >
                    {s.initial}
                  </span>
                  <span className="kr-display">{s.name}</span>
                </div>
                <div className="an-stacked-bar-wrap">
                  <div
                    className="an-stacked-bar"
                    style={{ width: `${totalPct}%` }}
                  >
                    <div
                      className="an-stacked-seg"
                      style={{
                        width: `${(s.jp / total) * 100}%`,
                        background: HESYA_COLORS.amber,
                      }}
                      title={`일본 ${s.jp}만`}
                    />
                    <div
                      className="an-stacked-seg"
                      style={{
                        width: `${(s.cn / total) * 100}%`,
                        background: HESYA_COLORS.navy,
                      }}
                      title={`중국 ${s.cn}만`}
                    />
                    <div
                      className="an-stacked-seg"
                      style={{
                        width: `${(s.en / total) * 100}%`,
                        background: HESYA_COLORS.sage,
                      }}
                      title={`영어권 ${s.en}만`}
                    />
                    <div
                      className="an-stacked-seg"
                      style={{
                        width: `${(s.vn / total) * 100}%`,
                        background: HESYA_COLORS.peach,
                      }}
                      title={`기타 ${s.vn}만`}
                    />
                  </div>
                </div>
                <div className="an-stacked-total mono">
                  {total}
                  <span className="kr">만</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="an-stacked-axis">
          <span className="mono">0</span>
          <span className="mono">500</span>
          <span className="mono">1000</span>
          <span className="mono">1500</span>
          <span className="mono">2000</span>
        </div>
      </div>
    </div>
  );
}

window.HesyaAnPart1 = {
  useFadeIn,
  AnalyticsHeader,
  KPIRow,
  LineChart,
  DonutChart,
  StackedBar,
  HESYA_COLORS,
};
