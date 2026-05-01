/* global React, ReactDOM */
const { useState: phS } = React;
const { TopHeader, NavSidebar } = window.HesyaCuParts1;
const { Header, PhotoGrid, DetailPanel, PHOTOS } = window.HesyaPhotoParts;

// We need a custom NavSidebar that highlights AI Photos
function PhotoNavSidebar() {
  const items = [
    { icon: "▦", label: "Dashboard" },
    { icon: "✉", label: "Inbox", badge: 12 },
    { icon: "▥", label: "Bookings" },
    { icon: "✂", label: "Services" },
    { icon: "◉", label: "Customers" },
    { icon: "◫", label: "Analytics" },
    { icon: "✦", label: "AI Photos", active: true, badge: 18 },
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
  const [filter, setFilter] = phS("latest");
  const [selected, setSelected] = phS(PHOTOS[0]);

  return (
    <div className="hesya-shell" data-screen-label="01 Photo Audit">
      <TopHeader />
      <div className="hesya-body">
        <PhotoNavSidebar />
        <main className="ph-main">
          <Header filter={filter} setFilter={setFilter} />
          <div className="ph-content">
            <div className="ph-grid-col-wrap">
              <PhotoGrid
                selected={selected}
                onSelect={setSelected}
                filter={filter}
              />
            </div>
            <div className="ph-detail-col">
              <DetailPanel photo={selected} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
