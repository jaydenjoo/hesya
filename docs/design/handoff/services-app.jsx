/* global React */
const { useState: useSv2, useEffect: useEv2, useRef: useRv2 } = React;
const {
  TopHeader,
  NavSidebar,
  Header,
  CategorySidebar,
  CardGrid,
  EmptyCategory,
  LANGS,
} = window.HesyaSvParts;

/* ──────────────── AI Proposal Card ──────────────── */
function AIProposal({ sourceText, targetLang, onApprove, onDismiss }) {
  const [thinking, setThinking] = useSv2(true);
  const [text, setText] = useSv2("");

  const PROPOSALS = {
    en: "Full K-Beauty Makeup Set — A complete professional makeup look featuring glass skin base, gradient lip, and natural-flush blush. Best for first-time visitors.",
    ja: "K-Beauty メイクアップ フルセット — ガラス肌、グラデーションリップ、ナチュラルチーク。初めての方にもおすすめです。",
    zhCN: "K-Beauty 全套妆容 — 包含水光肌底妆、渐变唇妆和自然腮红。适合初次到访的客人。",
    zhTW: "K-Beauty 全套妝容 — 包含水光肌底妝、漸層唇妝和自然腮紅。適合初次到訪的客人。",
    vi: "Trang điểm K-Beauty trọn gói — Lớp nền glass skin, son gradient, má hồng tự nhiên. Phù hợp cho khách lần đầu.",
  };

  useEv2(() => {
    setThinking(true);
    const timer = setTimeout(() => {
      setThinking(false);
      setText(PROPOSALS[targetLang] || "Translation not available.");
    }, 1500);
    return () => clearTimeout(timer);
  }, [targetLang]);

  return (
    <div className="sv-proposal" role="dialog" aria-label="AI 번역 제안">
      <div className="sv-proposal-head">
        <span className="sv-proposal-eyebrow">
          <span className="sv-sparkle">✨</span>
          <span className="kr">AI 번역 제안</span>
        </span>
        <button className="sv-proposal-close" onClick={onDismiss}>
          ×
        </button>
      </div>
      <div className="sv-proposal-meta kr">
        <span className="sv-proposal-from">한국어</span>
        <span className="sv-proposal-arrow">→</span>
        <span className="sv-proposal-to">
          {LANGS.find((l) => l.id === targetLang)?.label}
        </span>
        <span className="sv-proposal-disclaimer">검수 후 적용해주세요</span>
      </div>
      {thinking ? (
        <div className="sv-proposal-thinking">
          <div className="sv-think-shimmer">
            <span className="sv-think-line w1" />
            <span className="sv-think-line w2" />
            <span className="sv-think-line w3" />
          </div>
          <div className="sv-think-label kr">
            <span className="sv-sparkle">✨</span>
            <span>매장 톤에 맞춰 번역 중…</span>
          </div>
        </div>
      ) : (
        <>
          <div className="sv-proposal-content">{text}</div>
          <div className="sv-proposal-actions">
            <button className="sv-proposal-edit kr">직접 수정</button>
            <button className="sv-proposal-dismiss kr" onClick={onDismiss}>
              버리기
            </button>
            <button className="sv-proposal-apply kr" onClick={onApprove}>
              <span>✓</span>
              <span>이 번역으로 적용</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────── Editor Panel ──────────────── */
function EditorPanel({ svc, onClose, onTriggerKeywordModal }) {
  const [activeLang, setActiveLang] = useSv2("ko");
  const [showProposal, setShowProposal] = useSv2(false);
  const [advancedOpen, setAdvancedOpen] = useSv2(false);
  const [name, setName] = useSv2(svc?.kr || "");
  const [desc, setDesc] = useSv2(
    activeLang === "ko"
      ? "K-Beauty 시그니처 풀세트 — 글래스 피부 베이스, 그라데이션 립, 내추럴 혈색감 블러셔까지. 처음 오시는 분께 추천드려요."
      : "",
  );

  if (!svc) return null;

  const lang = LANGS.find((l) => l.id === activeLang);
  const status = svc.langs[activeLang];

  const handleAITranslate = () => setShowProposal(true);

  // simulated keyword check
  const handlePublish = () => {
    if (
      /마사지|고주파|울쎄라|LED/.test(desc) ||
      /마사지|고주파|울쎄라|LED/.test(name)
    ) {
      onTriggerKeywordModal();
    }
  };

  return (
    <aside className="sv-editor" role="dialog" aria-label="시술 편집">
      <header className="sv-editor-head">
        <button className="sv-editor-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="sv-editor-title">
          <div className="sv-editor-eyebrow kr">시술 편집</div>
          <h2 className="sv-editor-name kr-display">{svc.kr}</h2>
        </div>
        <div className="sv-editor-status">
          {svc.status === "published" ? (
            <span className="sv-pub-pill ok kr">● 게시 중</span>
          ) : (
            <span className="sv-pub-pill draft kr">● 초안</span>
          )}
        </div>
      </header>

      <div className="sv-tabs">
        {LANGS.map((l) => {
          const st = svc.langs[l.id];
          return (
            <button
              key={l.id}
              className={"sv-tab" + (activeLang === l.id ? " active" : "")}
              onClick={() => setActiveLang(l.id)}
            >
              <span className="sv-tab-flag">{l.flag}</span>
              <span className="sv-tab-label">{l.label}</span>
              {l.source && (
                <span className="sv-tab-star" title="원본 언어">
                  ★
                </span>
              )}
              {!l.source && st === "ok" && (
                <span className="sv-tab-mark ok">✓</span>
              )}
              {!l.source && st === "ai" && (
                <span className="sv-tab-mark ai">⚠</span>
              )}
              {!l.source && st === "none" && (
                <span className="sv-tab-mark none">—</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sv-editor-body">
        {/* Per-language form */}
        <div className="sv-form-section">
          <div className="sv-form-section-head">
            <span className="sv-form-section-eyebrow kr">
              <span>{lang.flag}</span>
              <span>{lang.label} 콘텐츠</span>
              {lang.source && <span className="sv-source-tag">원본</span>}
            </span>
            {!lang.source && status === "ai" && (
              <span className="sv-form-warn kr">
                <span>⚠</span>
                <span>자동 번역, 검수 필요</span>
              </span>
            )}
            {!lang.source && (
              <button className="sv-ai-btn kr" onClick={handleAITranslate}>
                <span className="sv-sparkle">✨</span>
                <span>AI로 번역하기</span>
              </button>
            )}
          </div>

          {showProposal && !lang.source && (
            <AIProposal
              sourceText={name}
              targetLang={activeLang}
              onApprove={() => setShowProposal(false)}
              onDismiss={() => setShowProposal(false)}
            />
          )}

          <label className="sv-field">
            <span className="sv-field-label kr">시술명</span>
            <div className="sv-field-input-wrap">
              <input
                className={"sv-input " + (lang.id === "ko" ? "kr-display" : "")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  lang.id === "ko" ? "예: K-Beauty 풀세트" : "Service name"
                }
              />
              <span className="sv-field-count mono">{name.length}/60</span>
            </div>
          </label>

          <label className="sv-field">
            <span className="sv-field-label kr">설명</span>
            <div className="sv-field-input-wrap">
              <textarea
                className={"sv-textarea " + (lang.id === "ko" ? "kr" : "")}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="손님이 보게 될 짧은 설명을 적어주세요."
              />
              <span className="sv-field-count mono">{desc.length}/280</span>
            </div>
          </label>

          <button
            className="sv-advanced-toggle kr"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <span>{advancedOpen ? "▾" : "▸"}</span>
            <span>SEO · 고급 옵션</span>
          </button>
          {advancedOpen && (
            <div className="sv-advanced">
              <label className="sv-field">
                <span className="sv-field-label-sm kr">SEO 제목</span>
                <input
                  className="sv-input"
                  placeholder="검색 결과에 표시될 제목"
                />
              </label>
              <label className="sv-field">
                <span className="sv-field-label-sm kr">메타 설명</span>
                <textarea
                  className="sv-textarea sv-textarea-sm"
                  placeholder="160자 이하 권장"
                />
              </label>
            </div>
          )}
        </div>

        {/* Shared section divider */}
        <div className="sv-shared-divider">
          <span className="sv-shared-label kr">
            아래 항목은 모든 언어에서 공유돼요
          </span>
        </div>

        {/* Photos */}
        <div className="sv-form-section">
          <div className="sv-form-section-head">
            <span className="sv-form-section-eyebrow kr">사진 갤러리</span>
            <span className="sv-form-meta">3 / 6</span>
          </div>
          <div className="sv-photo-row">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={"sv-photo-tile" + (i === 0 ? " primary" : "")}
                style={{
                  backgroundImage:
                    i === 0
                      ? svc.img
                      : `linear-gradient(${135 + i * 30}deg, #FDF8F1, #F5DDC8)`,
                }}
              >
                <span className="sv-photo-handle">⋮⋮</span>
                {i === 0 && <span className="sv-photo-primary kr">대표</span>}
              </div>
            ))}
            {[3, 4, 5].map((i) => (
              <div key={i} className="sv-photo-tile empty">
                <span className="sv-photo-add">+</span>
              </div>
            ))}
          </div>
        </div>

        {/* Duration + Price */}
        <div className="sv-form-section">
          <div className="sv-dual-row">
            <label className="sv-field">
              <span className="sv-field-label kr">소요 시간</span>
              <div className="sv-stepper">
                <button>−</button>
                <div className="sv-stepper-value">
                  <span className="mono">{svc.duration}</span>
                  <span className="sv-stepper-unit kr">분</span>
                </div>
                <button>+</button>
              </div>
            </label>
            <label className="sv-field">
              <span className="sv-field-label kr">가격</span>
              <div className="sv-price-input">
                <span className="sv-price-cur">₩</span>
                <input
                  className="sv-input mono"
                  defaultValue={svc.price.toLocaleString()}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Add-ons */}
        <div className="sv-form-section">
          <div className="sv-form-section-head">
            <span className="sv-form-section-eyebrow kr">추가 옵션</span>
            <button className="sv-mini-add kr">+ 옵션</button>
          </div>
          <div className="sv-addons">
            {[
              { kr: "헤어 스타일링 추가", price: 30000, on: true },
              { kr: "트라이얼 사진 촬영", price: 50000, on: true },
              { kr: "출장 (서울 한정)", price: 80000, on: false },
              { kr: "친구와 함께 (2인)", price: 120000, on: false },
            ].map((a, i) => (
              <label key={i} className={"sv-addon" + (a.on ? " on" : "")}>
                <span className={"sv-checkbox" + (a.on ? " on" : "")}>
                  {a.on ? "✓" : ""}
                </span>
                <span className="sv-addon-name kr">{a.kr}</span>
                <span className="sv-addon-price mono">
                  +₩{a.price.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Allergy / restriction */}
        <div className="sv-form-section">
          <div className="sv-form-section-head">
            <span className="sv-form-section-eyebrow kr">
              알레르기 · 제한 태그
            </span>
          </div>
          <div className="sv-tags">
            <span className="sv-tag">두피 민감 OK</span>
            <span className="sv-tag">임산부 가능</span>
            <span className="sv-tag muted">+ 태그 추가</span>
          </div>
        </div>

        {/* Compliance disclaimer */}
        <div className="sv-disclaimer">
          <div className="sv-disclaimer-head">
            <span className="sv-disclaimer-icon">🛡</span>
            <div>
              <div className="sv-disclaimer-title kr">컴플라이언스 보호</div>
              <div className="sv-disclaimer-sub kr">
                의료법 88조 · 무자격 안마행위 차단
              </div>
            </div>
          </div>
          <p className="sv-disclaimer-body kr">
            이 시술이 마사지·의료 기기를 포함하면 안 됩니다.
            <br />
            차단 키워드: <code>마사지</code> · <code>고주파</code> ·{" "}
            <code>LED</code> · <code>울쎄라</code>
            <br />
            대안: 단순 헤드 트리트먼트는 <strong>"두피 케어"</strong> 또는{" "}
            <strong>"스칼프 케어"</strong>로 표기하세요.
          </p>
        </div>
      </div>

      {/* Bottom action bar */}
      <footer className="sv-editor-foot">
        <button className="sv-foot-cancel kr" onClick={onClose}>
          취소
        </button>
        <div className="sv-foot-spacer" />
        <button className="sv-foot-draft kr">임시저장</button>
        <button className="sv-foot-publish kr" onClick={handlePublish}>
          <span>모든 언어로 게시</span>
          <span>→</span>
        </button>
      </footer>
    </aside>
  );
}

/* ──────────────── Keyword-block modal ──────────────── */
function KeywordModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div
        className="sv-modal"
        role="alertdialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sv-modal-head">
          <div className="sv-modal-icon">⚠</div>
          <h3 className="sv-modal-title kr-display">
            이 키워드는 사용할 수 없어요
          </h3>
        </div>
        <div className="sv-modal-body">
          <p className="sv-modal-lede kr">
            Hesya는 <strong>의료법 88조</strong>에 따라 무자격 안마행위 노출을
            차단합니다. 매장 보호를 위한 안전장치예요.
          </p>
          <div className="sv-modal-found">
            <div className="sv-modal-found-head kr">발견된 키워드</div>
            <div className="sv-modal-found-list">
              <span className="sv-modal-kw">
                <span className="kr">마사지</span>
                <span className="sv-modal-kw-meta mono">1회</span>
              </span>
              <span className="sv-modal-kw">
                <span className="kr">고주파</span>
                <span className="sv-modal-kw-meta mono">1회</span>
              </span>
            </div>
          </div>
          <div className="sv-modal-suggest">
            <div className="sv-modal-suggest-head kr">
              <span className="sv-sparkle">✨</span>
              <span>대신 이렇게 표기해보세요</span>
            </div>
            <div className="sv-modal-swap">
              <code className="sv-modal-bad">마사지</code>
              <span className="sv-modal-arrow">→</span>
              <code className="sv-modal-good">두피 케어</code>
            </div>
            <div className="sv-modal-swap">
              <code className="sv-modal-bad">마사지</code>
              <span className="sv-modal-arrow">→</span>
              <code className="sv-modal-good">스칼프 케어</code>
            </div>
          </div>
        </div>
        <footer className="sv-modal-foot">
          <button className="sv-modal-cancel kr" onClick={onClose}>
            그대로 두기
          </button>
          <button className="sv-modal-fix kr" onClick={onClose}>
            수정하러 가기 →
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ──────────────── App ──────────────── */
function App() {
  const [activeCat, setActiveCat] = useSv2("makeup");
  const [editingSvc, setEditingSvc] = useSv2(null);
  const [keywordModal, setKeywordModal] = useSv2(false);
  const [showEmpty, setShowEmpty] = useSv2(false);
  const [showBatchHint, setShowBatchHint] = useSv2(false);

  return (
    <div className="sd-app sv-app" data-screen-label="Services">
      <TopHeader />
      <div className="sd-shell">
        <NavSidebar />
        <main className={"sv-main" + (editingSvc ? " with-editor" : "")}>
          <Header onAIBatch={() => setShowBatchHint(!showBatchHint)} />
          <div className="sv-shell">
            <CategorySidebar
              active={activeCat}
              setActive={(id) => {
                setActiveCat(id);
                setShowEmpty(id === "nail");
              }}
            />
            <div className="sv-content">
              {showBatchHint && (
                <div className="sv-batch-hint">
                  <span className="sv-sparkle">✨</span>
                  <div className="sv-batch-text">
                    <div className="sv-batch-title kr-display">
                      4개 시술에 자동 번역 제안 준비됨
                    </div>
                    <div className="sv-batch-sub kr">
                      각 시술의 편집 패널에서 언어별로 검수해주세요. 일괄 자동
                      적용은 하지 않습니다.
                    </div>
                  </div>
                  <button
                    className="sv-batch-close"
                    onClick={() => setShowBatchHint(false)}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="sv-content-head">
                <div className="sv-content-title-row">
                  <h2 className="sv-content-title kr-display">메이크업</h2>
                  <span className="sv-content-meta kr">2개 시술</span>
                </div>
                <div className="sv-content-actions">
                  <div className="sv-search-mini">
                    <span>⌕</span>
                    <input placeholder="시술 검색…" className="kr" />
                  </div>
                  <button
                    className="sv-empty-toggle kr"
                    onClick={() => setShowEmpty(!showEmpty)}
                  >
                    {showEmpty ? "시술 보기" : "빈 카테고리 미리보기"}
                  </button>
                </div>
              </div>
              {showEmpty ? (
                <EmptyCategory />
              ) : (
                <CardGrid onEdit={setEditingSvc} />
              )}
            </div>
          </div>
        </main>
        {editingSvc && (
          <EditorPanel
            svc={editingSvc}
            onClose={() => setEditingSvc(null)}
            onTriggerKeywordModal={() => setKeywordModal(true)}
          />
        )}
      </div>
      <KeywordModal
        open={keywordModal}
        onClose={() => setKeywordModal(false)}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
