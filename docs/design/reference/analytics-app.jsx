/* global React, ReactDOM */
const { useState: anS } = React;
const { TopHeader } = window.HesyaCuParts1;
const { AnalyticsHeader, KPIRow, LineChart, DonutChart, StackedBar } =
  window.HesyaAnPart1;
const { Heatmap, Funnel, CohortTable, InsightBand } = window.HesyaAnPart2;

function AnalyticsNavSidebar() {
  const items = [
    { icon: "▦", label: "Dashboard" },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings" },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers" },
    { icon: "◫", label: "Analytics", active: true },
    { icon: "✦", label: "AI Photos", badge: 18 },
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

function App() {
  const [period, setPeriod] = anS("month");
  return (
    <div className="hesya-shell" data-screen-label="01 Analytics">
      <TopHeader />
      <div className="hesya-body">
        <AnalyticsNavSidebar />
        <main className="an-main">
          <AnalyticsHeader period={period} setPeriod={setPeriod} />
          <div className="an-scroll">
            <KPIRow />
            <div className="an-bento">
              <LineChart />
              <DonutChart />
              <StackedBar />
              <Heatmap />
              <Funnel />
              <CohortTable />
            </div>
            <InsightBand />
            <div className="an-spacer" />
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
