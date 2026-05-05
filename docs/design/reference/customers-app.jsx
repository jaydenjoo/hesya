/* global React, ReactDOM */
const { useState: cuS } = React;
const { TopHeader, NavSidebar, Header, FilterRow, DataTable, CUSTOMERS } =
  window.HesyaCuParts1;
const { DetailSheet, SegmentBuilder } = window.HesyaCuParts2;

function App() {
  const [filter, setFilter] = cuS("all");
  const [q, setQ] = cuS("");
  const [selected, setSelected] = cuS(CUSTOMERS[0]);
  const [showSeg, setShowSeg] = cuS(false);

  return (
    <div className="hesya-shell" data-screen-label="01 Customers">
      <TopHeader />
      <div className="hesya-body">
        <NavSidebar />
        <main className="cu-main">
          <Header onSegment={() => setShowSeg(true)} />
          <FilterRow filter={filter} setFilter={setFilter} q={q} setQ={setQ} />
          <div className={"cu-content" + (selected ? " has-detail" : "")}>
            <div className="cu-table-col">
              <DataTable selected={selected} onSelect={setSelected} q={q} />
            </div>
            {selected && (
              <div className="cu-detail-col">
                <DetailSheet
                  customer={selected}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      {showSeg && <SegmentBuilder onClose={() => setShowSeg(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
