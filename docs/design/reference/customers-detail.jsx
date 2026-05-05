/* global React */
const { useState: uS2 } = React;

function DetailSheet({ customer, onClose }) {
  const [tab, setTab] = uS2("overview");
  if (!customer) return null;
  const country = window.HesyaCuParts1.COUNTRIES[customer.c];
  const status = window.HesyaCuParts1.STATUS_MAP[customer.status];

  const tabs = [
    { id: "overview", kr: "개요" },
    { id: "history", kr: "방문 이력", n: customer.visits },
    { id: "preferences", kr: "선호" },
    { id: "photos", kr: "사진", n: 14 },
    { id: "messages", kr: "메시지" },
    { id: "notes", kr: "메모" },
  ];

  return (
    <div className="cu-detail">
      <div className="cu-detail-hero">
        <button className="cu-detail-close" onClick={onClose}>
          ×
        </button>
        <div className="cu-detail-hero-inner">
          <div
            className="cu-detail-avatar-lg"
            style={{
              background:
                customer.id % 3 === 0
                  ? "var(--hesya-peach-200)"
                  : customer.id % 3 === 1
                    ? "var(--hesya-amber-500)"
                    : "var(--hesya-navy-900)",
              color: customer.id % 3 === 0 ? "var(--hesya-navy-900)" : "#FFF",
            }}
          >
            {customer.kr.charAt(0)}
            <span className="cu-detail-flag-sm">{country.flag}</span>
          </div>
          <div className="cu-detail-hero-text">
            <div className="cu-detail-name-line">
              <h2 className="kr-display">{customer.kr}</h2>
              {customer.kr !== customer.roman && (
                <span className="cu-detail-roman">{customer.roman}</span>
              )}
              <span className={"cu-status-pill " + customer.status}>
                <span className="cu-status-icon">{status.icon}</span>
                <span className="kr">{status.kr}</span>
              </span>
            </div>
            <div className="cu-detail-meta-row">
              <span className="cu-detail-meta-it kr">
                <span>{country.flag}</span>
                {country.kr}
              </span>
              <span className="cu-detail-meta-sep" />
              <span className="cu-detail-meta-it">{customer.lang}</span>
              <span className="cu-detail-meta-sep" />
              <span className="cu-detail-meta-it kr">
                선호 <strong>{customer.stylist}</strong>
              </span>
              <span className="cu-detail-meta-sep" />
              <span className="cu-detail-meta-it">{customer.note}</span>
            </div>
            <div className="cu-detail-tags-row">
              {customer.tags.map((t, i) => (
                <span
                  key={i}
                  className={"cu-tag-mini" + (t === "VIP" ? " vip" : "")}
                >
                  {t}
                </span>
              ))}
              {customer.allergy && (
                <span className="cu-tag-mini allergy">⚠ 알레르기</span>
              )}
            </div>
          </div>
          <div className="cu-detail-hero-actions">
            <button className="cu-da-primary kr">메시지 보내기</button>
            <button className="cu-da-secondary kr">예약 잡기</button>
            <button className="cu-da-icon" title="더보기">
              ⋯
            </button>
          </div>
        </div>
      </div>

      <div className="cu-kpi-strip">
        <div className="cu-kpi">
          <div className="cu-kpi-label kr">총 방문</div>
          <div className="cu-kpi-val mono">
            {customer.visits}
            <span className="cu-kpi-unit kr">회</span>
          </div>
          <div className="cu-kpi-foot kr">평균 28일 간격</div>
        </div>
        <div className="cu-kpi">
          <div className="cu-kpi-label kr">총 결제</div>
          <div className="cu-kpi-val mono">
            ₩{(customer.total / 10000).toFixed(0)}
            <span className="cu-kpi-unit">만</span>
          </div>
          <div className="cu-kpi-foot kr">
            건당 평균 ₩{(customer.total / customer.visits / 10000).toFixed(1)}만
          </div>
        </div>
        <div className="cu-kpi">
          <div className="cu-kpi-label kr">최근 방문</div>
          <div className="cu-kpi-val kr-display" style={{ fontSize: 22 }}>
            {customer.last}
          </div>
          <div className="cu-kpi-foot kr">3월 12일 · 발레아쥬</div>
        </div>
        <div className="cu-kpi">
          <div className="cu-kpi-label kr">다음 예약</div>
          <div className="cu-kpi-val kr-display" style={{ fontSize: 22 }}>
            {customer.upcoming != null ? `D-${customer.upcoming}` : "—"}
          </div>
          <div className="cu-kpi-foot kr">
            {customer.upcoming != null ? "4월 3일 14:00 뿌리염색" : "예약 없음"}
          </div>
        </div>
      </div>

      <div className="cu-detail-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={"cu-detail-tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <span className="kr">{t.kr}</span>
            {t.n != null && <span className="cu-tab-n mono">{t.n}</span>}
          </button>
        ))}
      </div>

      <div className="cu-detail-body">
        {tab === "overview" && <OverviewTab customer={customer} />}
        {tab === "history" && <HistoryTab customer={customer} />}
        {tab === "preferences" && <PreferencesTab customer={customer} />}
        {tab === "photos" && <PhotosTab customer={customer} />}
        {tab === "messages" && <MessagesTab customer={customer} />}
        {tab === "notes" && <NotesTab customer={customer} />}
      </div>
    </div>
  );
}

function OverviewTab({ customer }) {
  return (
    <div className="cu-overview">
      <div className="cu-ov-col">
        <div className="cu-card">
          <div className="cu-card-head">
            <h3 className="kr-display">최근 시술</h3>
            <button className="cu-card-link kr">전체 보기 →</button>
          </div>
          <div className="cu-timeline">
            {[
              {
                date: "3월 12일",
                title: "발레아쥬 + 컷",
                price: "₩280,000",
                stylist: "민지",
                photo: true,
              },
              {
                date: "2월 8일",
                title: "뿌리염색",
                price: "₩120,000",
                stylist: "민지",
                photo: false,
              },
              {
                date: "1월 15일",
                title: "디지털펌",
                price: "₩180,000",
                stylist: "민지",
                photo: true,
              },
              {
                date: "12월 22일",
                title: "컷 + 트리트먼트",
                price: "₩100,000",
                stylist: "민지",
                photo: false,
              },
            ].map((v, i) => (
              <div key={i} className="cu-tl-item">
                <div className="cu-tl-marker">
                  <span className="cu-tl-dot" />
                  {i < 3 && <span className="cu-tl-line" />}
                </div>
                <div className="cu-tl-body">
                  <div className="cu-tl-head">
                    <span className="kr-display cu-tl-title">{v.title}</span>
                    <span className="cu-tl-price mono">{v.price}</span>
                  </div>
                  <div className="cu-tl-meta">
                    <span className="kr">{v.date}</span>
                    <span>·</span>
                    <span className="kr">디자이너 {v.stylist}</span>
                    {v.photo && (
                      <span className="cu-tl-photo-mark kr">📷 사진 있음</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cu-card">
          <div className="cu-card-head">
            <h3 className="kr-display">선호 디자이너</h3>
          </div>
          <div className="cu-stylist-card">
            <div
              className="cu-stylist-avatar"
              style={{ background: "var(--hesya-amber-500)" }}
            >
              민
            </div>
            <div className="cu-stylist-info">
              <div className="cu-stylist-name kr-display">민지</div>
              <div className="cu-stylist-role kr">
                시니어 컬러리스트 · 일본어 가능
              </div>
              <div className="cu-stylist-stats">
                <span className="kr">
                  담당 <strong className="mono">{customer.visits}</strong>회
                </span>
                <span>·</span>
                <span className="kr">
                  매칭률 <strong className="mono">100%</strong>
                </span>
              </div>
            </div>
            <button className="cu-da-secondary kr">변경</button>
          </div>
        </div>
      </div>

      <div className="cu-ov-col">
        <div className="cu-card cu-card-warn">
          <div className="cu-card-head">
            <h3 className="kr-display">⚠ 주의사항</h3>
          </div>
          <div className="cu-warn-list">
            <div className="cu-warn-item">
              <div className="cu-warn-tag kr">알레르기</div>
              <div className="cu-warn-text kr">
                PPD(파라페닐렌디아민) — 어두운 염색약 일부 성분
                <div className="cu-warn-sub">
                  2024년 1월 패치 테스트 양성 반응
                </div>
              </div>
            </div>
            <div className="cu-warn-item">
              <div className="cu-warn-tag kr">두피</div>
              <div className="cu-warn-text kr">
                민감성 — 암모니아 프리 제품 권장
              </div>
            </div>
          </div>
        </div>

        <div className="cu-card">
          <div className="cu-card-head">
            <h3 className="kr-display">결제 패턴</h3>
          </div>
          <div className="cu-pay-rows">
            <div className="cu-pay-row">
              <span className="kr">평균 객단가</span>
              <span className="mono">₩170,000</span>
            </div>
            <div className="cu-pay-row">
              <span className="kr">최고 결제액</span>
              <span className="mono">₩280,000</span>
            </div>
            <div className="cu-pay-row">
              <span className="kr">결제 수단</span>
              <span className="kr">체크카드 (Visa)</span>
            </div>
            <div className="cu-pay-row">
              <span className="kr">팁 평균</span>
              <span className="mono">12%</span>
            </div>
          </div>
        </div>

        <div className="cu-card">
          <div className="cu-card-head">
            <h3 className="kr-display">연락 채널</h3>
          </div>
          <div className="cu-channel-list">
            <div className="cu-channel-row">
              <span
                className="cu-ch-icon"
                style={{ background: "#FEE500", color: "#3C1E1E" }}
              >
                K
              </span>
              <div>
                <div className="kr">카카오톡</div>
                <div className="cu-ch-sub">@sakura.kr · 응답률 92%</div>
              </div>
            </div>
            <div className="cu-channel-row">
              <span
                className="cu-ch-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
                  color: "#FFF",
                }}
              >
                I
              </span>
              <div>
                <div className="kr">인스타 DM</div>
                <div className="cu-ch-sub">@sakura.tokyo · 12.4K</div>
              </div>
            </div>
            <div className="cu-channel-row">
              <span
                className="cu-ch-icon"
                style={{
                  background: "var(--gray-200)",
                  color: "var(--hesya-navy-900)",
                }}
              >
                ✉
              </span>
              <div>
                <div className="kr">이메일</div>
                <div className="cu-ch-sub">sakura.s@gmail.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="cu-history">
      <div className="cu-history-list">
        {[
          {
            date: "2024.03.12",
            title: "발레아쥬 + 컷",
            price: 280000,
            stylist: "민지",
            duration: "3h 20min",
            rating: 5,
          },
          {
            date: "2024.02.08",
            title: "뿌리염색",
            price: 120000,
            stylist: "민지",
            duration: "1h 45min",
            rating: 5,
          },
          {
            date: "2024.01.15",
            title: "디지털펌",
            price: 180000,
            stylist: "민지",
            duration: "2h 30min",
            rating: 4,
          },
          {
            date: "2023.12.22",
            title: "컷 + 트리트먼트",
            price: 100000,
            stylist: "민지",
            duration: "1h 30min",
            rating: 5,
          },
        ].map((v, i) => (
          <div key={i} className="cu-history-row">
            <div className="cu-h-date mono">{v.date}</div>
            <div className="cu-h-title kr-display">{v.title}</div>
            <div className="cu-h-stylist kr">{v.stylist}</div>
            <div className="cu-h-duration mono">{v.duration}</div>
            <div className="cu-h-rating">
              {"★".repeat(v.rating)}
              <span className="cu-h-rating-empty">
                {"★".repeat(5 - v.rating)}
              </span>
            </div>
            <div className="cu-h-price mono">₩{v.price.toLocaleString()}</div>
            <button className="cu-h-act">↗</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="cu-prefs">
      <div className="cu-pref-card">
        <h4 className="kr-display">선호 스타일</h4>
        <div className="cu-pref-tags">
          <span className="cu-tag-mini">밝은 톤</span>
          <span className="cu-tag-mini">자연스러운</span>
          <span className="cu-tag-mini">긴 머리</span>
          <span className="cu-tag-mini">레이어드</span>
        </div>
      </div>
      <div className="cu-pref-card">
        <h4 className="kr-display">예약 패턴</h4>
        <div className="cu-pref-rows">
          <div className="cu-pref-row">
            <span className="kr">선호 요일</span>
            <span className="kr">토요일 (75%)</span>
          </div>
          <div className="cu-pref-row">
            <span className="kr">선호 시간</span>
            <span>14:00–16:00</span>
          </div>
          <div className="cu-pref-row">
            <span className="kr">예약 채널</span>
            <span className="kr">카카오톡 (60%)</span>
          </div>
          <div className="cu-pref-row">
            <span className="kr">평균 리드타임</span>
            <span className="kr">3일 전</span>
          </div>
        </div>
      </div>
      <div className="cu-pref-card">
        <h4 className="kr-display">사용 제품</h4>
        <div className="cu-pref-products">
          <div className="cu-pp-row">
            <span>Wella Koleston Perfect 9/03</span>
            <span className="cu-pp-n kr">3회</span>
          </div>
          <div className="cu-pp-row">
            <span>Olaplex No.3</span>
            <span className="cu-pp-n kr">5회</span>
          </div>
          <div className="cu-pp-row">
            <span>L'Oreal Majirel 7.34</span>
            <span className="cu-pp-n kr">2회</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotosTab() {
  const photos = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="cu-photos-grid">
      {photos.map((i) => (
        <div
          key={i}
          className="cu-photo-tile"
          style={{
            background: `linear-gradient(${135 + i * 20}deg, var(--hesya-peach-200), var(--hesya-amber-500))`,
          }}
        >
          {i === 0 && <span className="cu-photo-badge kr">대표</span>}
          <span className="cu-photo-date mono">3.12</span>
        </div>
      ))}
    </div>
  );
}

function MessagesTab() {
  return (
    <div className="cu-messages-empty">
      <div className="cu-me-icon">✉</div>
      <div className="cu-me-text kr">최근 메시지 12건 · 평균 응답시간 8분</div>
      <button className="cu-da-primary kr">대화 열기 →</button>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="cu-notes">
      <div className="cu-note-input">
        <textarea
          className="kr"
          placeholder="메모 추가… (다른 디자이너도 볼 수 있어요)"
        />
        <button className="cu-da-primary kr">저장</button>
      </div>
      <div className="cu-note-list">
        <div className="cu-note-item">
          <div className="cu-note-head">
            <span className="cu-note-author kr">
              <strong>민지</strong> · 시니어
            </span>
            <span className="cu-note-date kr">3월 12일</span>
          </div>
          <p className="kr">
            2단 발레아쥬 진행. 뿌리는 6/0, 미디엄~끝은 9/03. 다음 방문 시 톤
            다운 원할 가능성 — 7/3으로 매칭하면 좋음.
          </p>
        </div>
        <div className="cu-note-item">
          <div className="cu-note-head">
            <span className="cu-note-author kr">
              <strong>현주</strong> · 매니저
            </span>
            <span className="cu-note-date kr">2월 8일</span>
          </div>
          <p className="kr">
            결혼 준비 중 (10월 예정). 브라이덜 패키지 제안하면 좋을 듯. 일본
            가족 방한 일정에 맞춰 메이크업 트라이얼 추천.
          </p>
        </div>
      </div>
    </div>
  );
}

function SegmentBuilder({ onClose }) {
  return (
    <div className="cu-segment-overlay" onClick={onClose}>
      <div className="cu-segment-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cu-segment-head">
          <div>
            <h2 className="kr-display">세그먼트 만들기</h2>
            <p className="kr cu-segment-sub">
              조건에 맞는 손님 그룹을 저장해 캠페인·공지에 활용하세요
            </p>
          </div>
          <button className="cu-detail-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cu-segment-body">
          <div className="cu-seg-name-row">
            <label className="kr">세그먼트 이름</label>
            <input
              className="kr"
              placeholder="예: 일본인 단골 — VIP"
              defaultValue="일본인 단골 — VIP"
            />
          </div>

          <div className="cu-seg-section">
            <div className="cu-seg-section-head">
              <h4 className="kr-display">조건</h4>
              <div className="cu-seg-match kr">
                <span>다음 조건 중</span>
                <select>
                  <option>모두</option>
                  <option>하나라도</option>
                </select>
                <span>충족하는 손님</span>
              </div>
            </div>

            <div className="cu-seg-rules">
              <div className="cu-seg-rule">
                <select className="kr">
                  <option>국가</option>
                  <option>언어</option>
                  <option>방문 횟수</option>
                  <option>총 결제</option>
                </select>
                <select className="kr">
                  <option>다음에 해당</option>
                  <option>다음에 해당하지 않음</option>
                </select>
                <div className="cu-seg-chips">
                  <span className="cu-seg-chip">
                    <span>🇯🇵</span>
                    <span className="kr">일본</span>
                    <button>×</button>
                  </span>
                  <span className="cu-seg-chip">
                    <span>🇨🇳</span>
                    <span className="kr">중국</span>
                    <button>×</button>
                  </span>
                  <button className="cu-seg-chip-add kr">+ 추가</button>
                </div>
                <button className="cu-seg-rule-rm">×</button>
              </div>

              <div className="cu-seg-rule">
                <select className="kr">
                  <option>방문 횟수</option>
                </select>
                <select className="kr">
                  <option>이상</option>
                  <option>이하</option>
                </select>
                <input
                  className="cu-seg-num mono"
                  type="number"
                  defaultValue="3"
                />
                <button className="cu-seg-rule-rm">×</button>
              </div>

              <div className="cu-seg-rule">
                <select className="kr">
                  <option>총 결제</option>
                </select>
                <select className="kr">
                  <option>이상</option>
                </select>
                <input
                  className="cu-seg-num mono"
                  type="number"
                  defaultValue="500000"
                />
                <span className="kr cu-seg-unit">원</span>
                <button className="cu-seg-rule-rm">×</button>
              </div>

              <div className="cu-seg-rule">
                <select className="kr">
                  <option>최근 방문</option>
                </select>
                <select className="kr">
                  <option>이내</option>
                </select>
                <input
                  className="cu-seg-num mono"
                  type="number"
                  defaultValue="60"
                />
                <span className="kr cu-seg-unit">일</span>
                <button className="cu-seg-rule-rm">×</button>
              </div>

              <button className="cu-seg-add-rule kr">+ 조건 추가</button>
            </div>
          </div>

          <div className="cu-seg-preview">
            <div className="cu-seg-preview-head">
              <span className="kr">미리보기</span>
              <span className="cu-seg-preview-n">
                <strong className="mono">38</strong>
                <span className="kr">명</span>
              </span>
            </div>
            <div className="cu-seg-preview-bar">
              <div className="cu-seg-bar-fill" style={{ width: "23%" }} />
            </div>
            <div className="cu-seg-preview-meta kr">
              전체 외국인 612명 중 6.2% · 예상 매출 ₩48.5M
            </div>
            <div className="cu-seg-preview-faces">
              {CUSTOMERS.slice(0, 8).map((c, i) => (
                <div
                  key={i}
                  className="cu-seg-face"
                  style={{
                    background:
                      i % 3 === 0
                        ? "var(--hesya-peach-200)"
                        : i % 3 === 1
                          ? "var(--hesya-amber-500)"
                          : "var(--hesya-navy-900)",
                    color: i === 0 ? "var(--hesya-navy-900)" : "#FFF",
                  }}
                >
                  {c.kr.charAt(0)}
                </div>
              ))}
              <div className="cu-seg-face cu-seg-face-more">+30</div>
            </div>
          </div>
        </div>

        <div className="cu-segment-foot">
          <button className="cu-da-secondary kr" onClick={onClose}>
            취소
          </button>
          <div className="cu-segment-foot-r">
            <button className="cu-da-secondary kr">테스트 메시지</button>
            <button className="cu-da-primary kr">세그먼트 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CUSTOMERS = window.HesyaCuParts1.CUSTOMERS;

window.HesyaCuParts2 = { DetailSheet, SegmentBuilder };
