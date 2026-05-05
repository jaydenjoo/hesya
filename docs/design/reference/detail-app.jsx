/* global React */
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;
const IconD = window.__hesyaIcons;

const services = {
  Hair: [
    {
      id: "h1",
      t: "K-Drama Layered Cut",
      d: "60min",
      krw: 85000,
      jpy: 8650,
      usd: 62,
      t1: ["EN", "JA"],
      img: "s-1",
    },
    {
      id: "h2",
      t: "Glass Hair Treatment",
      d: "90min",
      krw: 120000,
      jpy: 12200,
      usd: 87,
      t1: ["EN", "JA", "CN"],
      img: "s-2",
    },
    {
      id: "h3",
      t: "송혜교 Short Bob",
      d: "60min",
      krw: 95000,
      jpy: 9670,
      usd: 69,
      t1: ["EN", "JA"],
      img: "s-3",
    },
  ],
  Color: [
    {
      id: "c1",
      t: "Pink-Blonde Balayage",
      d: "180min",
      krw: 280000,
      jpy: 28500,
      usd: 203,
      t1: ["EN"],
      img: "s-4",
    },
    {
      id: "c2",
      t: "Personal Color 진단",
      d: "45min",
      krw: 60000,
      jpy: 6100,
      usd: 44,
      t1: ["EN", "JA", "CN"],
      img: "s-5",
    },
  ],
  Treatment: [
    {
      id: "t1",
      t: "Olaplex Repair Spa",
      d: "60min",
      krw: 90000,
      jpy: 9160,
      usd: 65,
      t1: ["EN", "JA"],
      img: "s-2",
    },
  ],
  "Add-ons": [
    {
      id: "a1",
      t: "Scalp Massage",
      d: "20min",
      krw: 25000,
      jpy: 2540,
      usd: 18,
      t1: ["EN"],
      img: "s-3",
    },
  ],
};

const stylists = [
  {
    n: "이수진 Su-jin",
    spec: "K-drama cuts · 7 yrs",
    flags: "🇰🇷🇺🇸🇯🇵",
    score: "4.96",
    p: "",
  },
  {
    n: "박민지 Min-ji",
    spec: "Color · personal color",
    flags: "🇰🇷🇺🇸",
    score: "4.91",
    p: "p-2",
  },
  {
    n: "정하늘 Ha-neul",
    spec: "Glass hair · keratin",
    flags: "🇰🇷🇨🇳🇯🇵",
    score: "4.88",
    p: "p-3",
  },
  {
    n: "김지원 Ji-won",
    spec: "K-pop styling",
    flags: "🇰🇷🇺🇸🇯🇵🇨🇳",
    score: "4.94",
    p: "p-4",
  },
];

const reviewsD = [
  {
    f: "🇯🇵",
    n: "Aoi.tokyo",
    d: "2일 전",
    s: 5,
    q: "송혜교 단발 그대로 만들어주셨어요! 디자이너님 일본어 가능해서 너무 안심했어요.",
    t: "She made me the exact Song Hye-kyo bob! Designer spoke Japanese so I felt at ease.",
  },
  {
    f: "🇨🇳",
    n: "Mei_xhs",
    d: "5일 전",
    s: 5,
    q: "personal color 진단 정확했어요. 봄웜톤이라네요!",
    t: "The personal color diagnosis was spot on. I'm spring warm tone!",
  },
  {
    f: "🇺🇸",
    n: "emma.korea",
    d: "1주 전",
    s: 4,
    q: "Pink balayage came out beautifully. Took 3+ hours but worth it.",
    t: "—",
  },
];

const compareData = [
  { row: "Avg foreign price", a: "₩90k", b: "₩105k", c: "₩88k" },
  { row: "Foreign rating", a: "4.92", b: "4.71", c: "4.83" },
  { row: "English fluency", a: "5/5", b: "3/5", c: "4/5" },
  { row: "Japanese fluency", a: "5/5", b: "2/5", c: "3/5" },
  { row: "Chinese fluency", a: "4/5", b: "1/5", c: "2/5" },
  { row: "Female designers", a: "6/8", b: "3/8", c: "5/9" },
  { row: "Walk to station", a: "4 min", b: "8 min", c: "6 min" },
  {
    row: "Specialty",
    a: "K-drama cuts",
    b: "Bridal hair",
    c: "Men's grooming",
  },
];

const ugcTiles = [
  { src: "insta", a: "@aoi.tokyo", st: 5, t: "t-1" },
  { src: "xhs", a: "Mei_06", st: 5, t: "t-2" },
  { src: "insta", a: "@emma.k", st: 4, t: "t-3" },
  { src: "insta", a: "@yi_ling", st: 5, t: "t-4" },
  { src: "xhs", a: "小红薯", st: 5, t: "t-5" },
  { src: "insta", a: "@linh.vn", st: 5, t: "t-6" },
  { src: "insta", a: "@sakura88", st: 4, t: "t-2" },
  { src: "xhs", a: "Lulu_xhs", st: 5, t: "t-3" },
  { src: "insta", a: "@hana_jp", st: 5, t: "t-1" },
];

function Detail() {
  const [slide, setSlide] = useStateD(0);
  const [tab, setTab] = useStateD("Services");
  const [reviewFilter, setReviewFilter] = useStateD("All");
  const [selected, setSelected] = useStateD("h1");
  const [fav, setFav] = useStateD(false);
  const [open, setOpen] = useStateD(0);
  const [showSheet, setShowSheet] = useStateD(null);
  const [showMini, setShowMini] = useStateD(false);
  const trackRef = useRefD(null);
  const scrollRef = useRefD(null);

  useEffectD(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowMini(el.scrollTop > 280);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffectD(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setSlide(idx);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const selectedSvc = Object.values(services)
    .flat()
    .find((s) => s.id === selected);

  return (
    <div className="detail-stage">
      <div className="iphone-d">
        <div className="notch" />

        {/* Sticky mini header (above scroll) */}
        <div className={"mini-header" + (showMini ? " show" : "")}>
          <div className="back-mini">
            <IconD.chevR size={16} style={{ transform: "rotate(180deg)" }} />
          </div>
          <div className="avatar-mini">S</div>
          <div className="name">스타일리스타 홍대</div>
          <div className="stars">
            ★ <b>4.92</b>
          </div>
          <button className="cta-mini">Book →</button>
        </div>

        <div className="scroll-d" ref={scrollRef}>
          {/* Hero gallery */}
          <div className="hero-gallery">
            <div className="hero-track" ref={trackRef}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`hero-slide h-${i}`}>
                  <div className="interior-l">
                    {i === 1
                      ? "Stylista"
                      : i === 2
                        ? "interior"
                        : i === 3
                          ? "stylists"
                          : i === 4
                            ? "color bar"
                            : "lounge"}
                  </div>
                </div>
              ))}
            </div>
            <div className="hero-overlay" />
            <div className="hero-top">
              <div className="glass-circle">
                <IconD.chevR
                  size={18}
                  style={{ transform: "rotate(180deg)" }}
                />
              </div>
              <span className="glass-pill">
                <IconD.globe size={13} /> EN
              </span>
            </div>
            <div className="dots">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={"dot" + (i === slide ? " active" : "")}
                />
              ))}
            </div>
          </div>

          {/* Info block */}
          <div className="info-block">
            <h1 className="name-kr">스타일리스타 홍대점</h1>
            <div className="name-en">Stylista — Hongdae</div>
            <div className="meta-row">
              <span className="stars-l">★</span>
              <b>4.92</b>
              <span>(124 reviews)</span>
              <span className="dot-sep">·</span>
              <span>5 min from 홍대입구역</span>
              <span className="gold-badge">★ K-Verified</span>
            </div>
            <div className="lang-row">
              <span className="lang-pill-s">🇰🇷 모든 직원</span>
              <span className="lang-pill-s">🇺🇸 4명</span>
              <span className="lang-pill-s">🇯🇵 3명</span>
              <span className="lang-pill-s">🇨🇳 2명</span>
            </div>
            <p className="desc">
              홍대 골목에 자리한 K-드라마 스타일 전문 살롱. 외국인 고객의 60%
              이상이 일본·대만에서 방문하며, 전 디자이너가 영어 또는 일본어 응대
              가능합니다. 송혜교·아이유 헤어컷 시술 경험 4년 이상. 개별 룸 시술
              가능, 주차 무료 30분 제공.
            </p>
            <span className="read-more">Read more</span>
          </div>

          {/* Safety profile strip (female-friendly verified) */}
          <div className="safety-strip-label">
            <span>Safety profile</span>
            <span className="badge-fv">Female-friendly verified</span>
          </div>
          <div className="safety-strip-d">
            <div
              className="safety-chip"
              onClick={() => setShowSheet("designers")}
            >
              <span className="chip-ico">👥</span>여성 디자이너 6/8
            </div>
            <div className="safety-chip" onClick={() => setShowSheet("hours")}>
              <span className="chip-ico">🌅</span>10–20시 안전
            </div>
            <div className="safety-chip" onClick={() => setShowSheet("walk")}>
              <span className="chip-ico">🚇</span>도보 4분
            </div>
            <div
              className="safety-chip"
              onClick={() => setShowSheet("verified")}
            >
              <span className="chip-ico">✓</span>247명 인증
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-d">
            {[
              ["Services"],
              ["Stylists"],
              ["Reviews"],
              ["Live UGC", true],
              ["Compare", true],
              ["Info"],
            ].map(([n, isNew]) => (
              <div
                key={n}
                className={"tab-d" + (n === tab ? " active" : "")}
                onClick={() => setTab(n)}
              >
                <span>{n}</span>
                {isNew && <span className="new-flag">NEW</span>}
              </div>
            ))}
          </div>

          {/* Tab content */}
          <div className="tab-content" key={tab}>
            {tab === "Services" && (
              <div>
                {Object.entries(services).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="cat-head">{cat}</div>
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className={
                          "svc-card" + (s.id === selected ? " selected" : "")
                        }
                        onClick={() => setSelected(s.id)}
                      >
                        <div className={`svc-thumb ${s.img}`} />
                        <div className="svc-info">
                          <div className="svc-name">{s.t}</div>
                          <div className="svc-meta">
                            <span>{s.d}</span>
                            <span>·</span>
                            <span className="svc-price">
                              ₩{(s.krw / 1000).toFixed(0)}k
                            </span>
                            <span className="svc-conv">
                              ≈ ¥{s.jpy.toLocaleString()}
                            </span>
                          </div>
                          <div className="svc-tags">
                            {s.t1.map((l) => (
                              <span className="lang-tag" key={l}>
                                {l} OK
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="chev">
                          <IconD.chevR size={16} />
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {tab === "Stylists" && (
              <div className="stylist-grid">
                {stylists.map((s, i) => (
                  <div className="stylist-card" key={i}>
                    <div className={`stylist-portrait ${s.p}`} />
                    <div className="s-name">{s.n}</div>
                    <div className="s-spec">{s.spec}</div>
                    <div className="s-flags">{s.flags}</div>
                    <div className="s-score">
                      <span className="star">★</span> {s.score}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "Reviews" && (
              <div>
                <div className="review-filter">
                  {[
                    ["All", "🌐"],
                    ["JP", "🇯🇵"],
                    ["US", "🇺🇸"],
                    ["CN", "🇨🇳"],
                    ["VN", "🇻🇳"],
                  ].map(([k, f]) => (
                    <span
                      key={k}
                      className={
                        "chip-r" + (k === reviewFilter ? " active" : "")
                      }
                      onClick={() => setReviewFilter(k)}
                    >
                      {f} {k === "All" ? "All" : ""}
                    </span>
                  ))}
                </div>
                <div className="review-list">
                  {reviewsD.map((r, i) => (
                    <div className="review-item" key={i}>
                      <div className="top-r">
                        <span className="flag-r">{r.f}</span>
                        <span className="author">{r.n}</span>
                        <span className="stars-r">{"★".repeat(r.s)}</span>
                        <span className="date">{r.d}</span>
                      </div>
                      <div className="quote-r">{r.q}</div>
                      {r.t !== "—" && (
                        <div className="accordion">
                          <div className="acc-head">
                            <IconD.chevR size={10} /> Translate to English
                          </div>
                          <div className="trans-r">"{r.t}"</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Live UGC" && (
              <div>
                <div className="review-filter">
                  {[
                    ["All", "전체"],
                    ["JP", "🇯🇵"],
                    ["CN-S", "🇨🇳간"],
                    ["CN-T", "🇨🇳번"],
                    ["US", "🇺🇸"],
                    ["VN", "🇻🇳"],
                  ].map(([k, l]) => (
                    <span
                      key={k}
                      className={
                        "chip-r" + (k === reviewFilter ? " active" : "")
                      }
                      onClick={() => setReviewFilter(k)}
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <div className="ugc-grid">
                  {ugcTiles.map((u, i) => (
                    <div className={`ugc-tile ${u.t}`} key={i}>
                      <div className={`src-icon ${u.src}`}>
                        {u.src === "insta" ? "◉" : "红"}
                      </div>
                      <div className="author">{u.a}</div>
                      <div className="star-r">★{u.st}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Compare" && (
              <div className="compare-wrap">
                <div className="compare-intro">
                  Same service category, nearby. 같은 카테고리 인근 매장.
                </div>
                <div className="compare-table-wrap">
                  <div className="compare-table">
                    <div className="ch"></div>
                    <div className="ch this-col">스타일리스타</div>
                    <div className="ch">Salon A</div>
                    <div className="ch">Salon B</div>
                    {compareData.map((r, i) => {
                      const isLast = i === compareData.length - 1;
                      const cls = isLast ? "row-end" : "";
                      return (
                        <React.Fragment key={i}>
                          <div className={`rh ${cls}`}>{r.row}</div>
                          <div className={`cell this-col ${cls}`}>{r.a}</div>
                          <div className={`cell ${cls}`}>{r.b}</div>
                          <div className={`cell ${cls}`}>{r.c}</div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div className="compare-guide">
                  <h5>Why this matters / 비교 가이드</h5>
                  <p>
                    Higher language fluency = smoother consult. The peach column
                    is this salon — compare row by row to see strengths and
                    trade-offs before booking.
                  </p>
                </div>
              </div>
            )}

            {tab === "Info" && (
              <div className="info-tab">
                <div className="map-prev">
                  <div className="pin">📍</div>
                  <div className="map-tag">
                    서울 마포구 양화로 12길 23 · Tap to expand
                  </div>
                </div>
                <div className="info-row">
                  <div className="ico">
                    <IconD.calendar size={16} />
                  </div>
                  <div className="body">
                    <h6>Business hours</h6>
                    <div className="hours-list">
                      {[
                        ["Mon", "10:00–20:00"],
                        ["Tue", "10:00–20:00"],
                        ["Wed", "Closed"],
                        ["Thu", "10:00–20:00"],
                        ["Fri", "10:00–21:00", true],
                        ["Sat", "11:00–20:00"],
                        ["Sun", "11:00–18:00"],
                      ].map(([d, h, today]) => (
                        <div
                          key={d}
                          className={"hr-row" + (today ? " today" : "")}
                        >
                          <span className="day">{d}</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="ico">📞</div>
                  <div className="body">
                    <h6>Phone</h6>
                    <p>+82 2-336-1234 · 영어/일어 통화 가능</p>
                  </div>
                </div>
                <div className="info-row">
                  <div className="ico">♿</div>
                  <div className="body">
                    <h6>Accessibility</h6>
                    <p>
                      Wheelchair access from side entrance. Elevator to 2F.
                      Service animals welcome.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Allergy disclosure */}
          <div className="allergy">
            <h4>이 시술의 안전 정보 / Treatment safety</h4>
            {[
              {
                t: "사용 제품 (브랜드·성분) / Products used",
                body: "ingredients",
              },
              { t: "알러지 사전 안내 / Allergy disclosure", body: "allergy" },
              {
                t: "시술 후 모발/피부 케어 / Aftercare guide",
                body: "aftercare",
              },
            ].map((it, i) => (
              <div key={i} className={"acc" + (i === open ? " open" : "")}>
                <div
                  className="acc-row"
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <span className="label-a">{it.t}</span>
                  <span className="arr">
                    <IconD.chevR size={14} />
                  </span>
                </div>
                <div className="acc-body">
                  {it.body === "ingredients" && (
                    <>
                      <div className="ing-row">
                        <span>Olaplex No.3 Hair Perfector</span>
                        <span className="ewg">EWG 3</span>
                      </div>
                      <div className="ing-row">
                        <span>L'Oréal Inoa Color (PPD-free)</span>
                        <span className="ewg">EWG 4</span>
                      </div>
                      <div className="ing-row">
                        <span>Mucota Aire Treatment</span>
                        <span className="ewg mid">EWG 5</span>
                      </div>
                    </>
                  )}
                  {it.body === "allergy" && (
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      Color services contain PPD-free dyes. Patch test
                      recommended 48h prior for first-time visitors. Notify
                      staff of any prior allergic reactions to hair products.
                    </p>
                  )}
                  {it.body === "aftercare" && (
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      48h: avoid washing. Use sulfate-free shampoo. Heat ≤ 150°C
                      for 2 weeks. Free aftercare consultation in your language
                      for 30 days.
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className="footer-a">
              <span>First time? Discuss with stylist before treatment.</span>
              <span className="send-link">Send pre-treatment Qs →</span>
            </div>
          </div>

          <div style={{ height: 16 }} />
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <button
            className={"ghost-btn fav" + (fav ? " active" : "")}
            onClick={() => setFav(!fav)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={fav ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="ghost-btn">
            <IconD.message size={20} />
          </button>
          <button className="cta-main">
            <span className="cta-stack">
              <span>Book this stylist →</span>
              {selectedSvc && (
                <span className="selected-svc">
                  {selectedSvc.t} · ₩{(selectedSvc.krw / 1000).toFixed(0)}k
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Safety sheet */}
        {showSheet && (
          <div className="sheet-overlay" onClick={() => setShowSheet(null)}>
            <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              {showSheet === "designers" && (
                <>
                  <h3>여성 디자이너 6 / 8</h3>
                  {stylists.slice(0, 4).map((s, i) => (
                    <div className="sh-row" key={i}>
                      <div
                        className="ico"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--hesya-peach-200), var(--hesya-amber-500))",
                        }}
                      />
                      <div>
                        <b>{s.n}</b> · {s.spec}
                      </div>
                    </div>
                  ))}
                  <div className="sh-row">
                    + 2 designers shown in Stylists tab
                  </div>
                </>
              )}
              {showSheet === "hours" && (
                <>
                  <h3>10–20시 안전 운영</h3>
                  <div className="sh-row">
                    <div className="ico">🌅</div>
                    <div>
                      Salon operates only during daylight hours when the
                      surrounding street is busy.
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">🚓</div>
                    <div>홍대 파출소 250m, 24/7 patrol on this block.</div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">💡</div>
                    <div>Side entrance is well-lit even after closing.</div>
                  </div>
                </>
              )}
              {showSheet === "walk" && (
                <>
                  <h3>도보 4분 · 홍대입구역 9번 출구</h3>
                  <div className="sh-row">
                    <div className="ico">🚇</div>
                    <div>
                      <b>Line 2 · 6 · AREX</b> all connect at 홍대입구역.
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">📍</div>
                    <div>
                      Walking route on main 양화로 — no alley shortcuts after
                      dark.
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">🚖</div>
                    <div>Kakao Taxi pickup zone 50m from salon.</div>
                  </div>
                </>
              )}
              {showSheet === "verified" && (
                <>
                  <h3>247명 외국인 인증 방문</h3>
                  <div className="sh-row">
                    <div className="ico">🇯🇵</div>
                    <div>
                      <b>112</b> · Japan
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">🇨🇳</div>
                    <div>
                      <b>68</b> · China & Taiwan
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">🇺🇸</div>
                    <div>
                      <b>41</b> · USA / Canada
                    </div>
                  </div>
                  <div className="sh-row">
                    <div className="ico">🇻🇳</div>
                    <div>
                      <b>26</b> · Vietnam & SEA
                    </div>
                  </div>
                  <div
                    className="sh-row"
                    style={{ fontSize: 11, color: "var(--gray-500)" }}
                  >
                    Numbers reflect verified Hesya bookings only. Updated daily.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Detail />);
