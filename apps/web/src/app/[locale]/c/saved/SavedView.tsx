"use client";

/**
 * Customer Saved (저장한 매장) — 클라이언트 인터랙티브 view.
 * Reference: docs/design/reference/Hesya Customer Saved.html
 *
 * 베타 단계: MOCK 데이터 + localStorage 저장 (saved-stores 테이블 없음).
 * 추후 saved_stores DAL 도입 시 server-side로 옮긴다.
 */

import { useCallback, useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

type Category = "all" | "hair" | "nail" | "makeup" | "skin";
type SortKey = "recent" | "distance" | "price" | "rating";

type StoreCard = {
  id: string;
  cat: Exclude<Category, "all">;
  bg: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  nameKo: string;
  nameEn: string;
  catLabel: string;
  station: string;
  range: number;
  rating: number;
  reviews: number;
  respMinutes: number;
  tags: { text: string; lang?: "ko" }[];
  badges: { kVerified?: boolean; femaleFriendly?: boolean };
  ariaLabel: string;
};

const STORES: StoreCard[] = [
  {
    id: "s1",
    cat: "hair",
    bg: 1,
    nameKo: "Stylista 홍대",
    nameEn: "HONGDAE",
    catLabel: "헤어",
    station: "홍대입구역",
    range: 3,
    rating: 4.9,
    reviews: 312,
    respMinutes: 2,
    tags: [
      { text: "K-드라마 컷", lang: "ko" },
      { text: "영어 응대", lang: "ko" },
    ],
    badges: { kVerified: true, femaleFriendly: true },
    ariaLabel: "Stylista 홍대 — K-드라마 헤어 시술",
  },
  {
    id: "s2",
    cat: "hair",
    bg: 2,
    nameKo: "Mirror Glass 성수",
    nameEn: "SEONGSU",
    catLabel: "헤어",
    station: "성수역",
    range: 2,
    rating: 4.7,
    reviews: 184,
    respMinutes: 8,
    tags: [
      { text: "남성 컷 전문", lang: "ko" },
      { text: "당일 예약", lang: "ko" },
    ],
    badges: {},
    ariaLabel: "Mirror Glass 성수 — 헤어 시술",
  },
  {
    id: "s3",
    cat: "hair",
    bg: 3,
    nameKo: "Color Lab 강남",
    nameEn: "SINSA",
    catLabel: "헤어",
    station: "신사역",
    range: 4,
    rating: 4.8,
    reviews: 256,
    respMinutes: 3,
    tags: [{ text: "발레아쥬 전문", lang: "ko" }, { text: "EN · JA · ZH" }],
    badges: { kVerified: true, femaleFriendly: true },
    ariaLabel: "Color Lab 강남 — 발레아쥬 컬러",
  },
  {
    id: "s4",
    cat: "nail",
    bg: 4,
    nameKo: "Nail Atelier 청담",
    nameEn: "CHEONGDAM",
    catLabel: "네일",
    station: "청담역",
    range: 3,
    rating: 4.9,
    reviews: 428,
    respMinutes: 5,
    tags: [
      { text: "젤리 네일", lang: "ko" },
      { text: "매그넷 디자인", lang: "ko" },
    ],
    badges: { kVerified: true },
    ariaLabel: "Nail Atelier 청담 — 젤리 네일",
  },
  {
    id: "s5",
    cat: "skin",
    bg: 5,
    nameKo: "Glass Skin 이태원",
    nameEn: "ITAEWON",
    catLabel: "스킨",
    station: "이태원역",
    range: 3,
    rating: 4.6,
    reviews: 142,
    respMinutes: 12,
    tags: [
      { text: "산 필링", lang: "ko" },
      { text: "한방 케어", lang: "ko" },
    ],
    badges: { femaleFriendly: true },
    ariaLabel: "Glass Skin 이태원 — 산 필링",
  },
  {
    id: "s6",
    cat: "makeup",
    bg: 6,
    nameKo: "Lash & Brow 명동",
    nameEn: "MYEONGDONG",
    catLabel: "메이크업",
    station: "명동역",
    range: 2,
    rating: 4.8,
    reviews: 318,
    respMinutes: 4,
    tags: [{ text: "래쉬 리프트", lang: "ko" }, { text: "JA · EN" }],
    badges: {},
    ariaLabel: "Lash & Brow 명동 — 래쉬 리프트",
  },
  {
    id: "s7",
    cat: "hair",
    bg: 7,
    nameKo: "Tonic 성수",
    nameEn: "SEONGSU",
    catLabel: "헤어",
    station: "뚝섬역",
    range: 3,
    rating: 4.7,
    reviews: 96,
    respMinutes: 3,
    tags: [
      { text: "히메컷", lang: "ko" },
      { text: "디지털 펌", lang: "ko" },
    ],
    badges: { kVerified: true },
    ariaLabel: "Tonic 성수 — 히메컷",
  },
  {
    id: "s8",
    cat: "makeup",
    bg: 8,
    nameKo: "Soft Studio 한남",
    nameEn: "HANNAM",
    catLabel: "메이크업",
    station: "한강진역",
    range: 3,
    rating: 4.9,
    reviews: 204,
    respMinutes: 6,
    tags: [
      { text: "자연 눈썹", lang: "ko" },
      { text: "글래스 메이크업", lang: "ko" },
    ],
    badges: { femaleFriendly: true },
    ariaLabel: "Soft Studio 한남 — 자연 눈썹 정리",
  },
];

const CAT_LABELS: { key: Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "hair", label: "헤어" },
  { key: "nail", label: "네일" },
  { key: "makeup", label: "메이크업" },
  { key: "skin", label: "스킨" },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg
      className="star"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Range({ value }: { value: number }) {
  // ₩ filled value (1-4) + dim remainder
  const filled = "₩".repeat(value);
  const fade = "₩".repeat(4 - value);
  return (
    <span className="range">
      {filled}
      {fade && <span className="fade">{fade}</span>}
    </span>
  );
}

export function SavedView() {
  const [unsavedIds, setUnsavedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const visibleStores = useMemo(() => {
    const filtered = STORES.filter((s) => !unsavedIds.has(s.id)).filter(
      (s) => activeCat === "all" || s.cat === activeCat,
    );
    const sorted = [...filtered];
    switch (sortKey) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        sorted.sort((a, b) => a.respMinutes - b.respMinutes);
        break;
      case "price":
        sorted.sort((a, b) => a.range - b.range);
        break;
      default:
        break;
    }
    return sorted;
  }, [unsavedIds, activeCat, sortKey]);

  const counts = useMemo(() => {
    const remaining = STORES.filter((s) => !unsavedIds.has(s.id));
    return {
      all: remaining.length,
      hair: remaining.filter((s) => s.cat === "hair").length,
      nail: remaining.filter((s) => s.cat === "nail").length,
      makeup: remaining.filter((s) => s.cat === "makeup").length,
      skin: remaining.filter((s) => s.cat === "skin").length,
    };
  }, [unsavedIds]);

  const toggleHeart = useCallback((id: string) => {
    setUnsavedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const enterSelection = useCallback(() => setSelectionMode(true), []);
  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const bulkUnsave = useCallback(() => {
    setUnsavedIds((cur) => {
      const next = new Set(cur);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    exitSelection();
  }, [selectedIds, exitSelection]);

  const compareTarget =
    selectedIds.size >= 2
      ? `/c/compare?ids=${Array.from(selectedIds).join(",")}`
      : "/c/compare";

  return (
    <div className={selectionMode ? "saved-page selection-mode" : "saved-page"}>
      <header
        className={selectionMode ? "topbar is-selection" : "topbar"}
        role="banner"
      >
        {selectionMode ? (
          <button
            type="button"
            className="back-btn"
            aria-label="선택 모드 종료"
            onClick={exitSelection}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        ) : (
          <Link className="back-btn" href="/c/mypage" aria-label="뒤로 가기">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        )}
        {!selectionMode ? (
          <div className="topbar-title">
            <h1>
              <span className="ko" lang="ko">
                저장한 매장
              </span>
            </h1>
            <span className="count">{counts.all} saved</span>
          </div>
        ) : (
          <div className="topbar-title">
            <h1>
              <span className="mono">{selectedIds.size}</span>
              <span className="ko" lang="ko" style={{ marginLeft: 6 }}>
                개 선택됨
              </span>
            </h1>
          </div>
        )}
        {!selectionMode ? (
          <div className="sort-wrap">
            <label htmlFor="sort">정렬</label>
            <select
              id="sort"
              aria-label="정렬 기준"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="recent">최근 저장순</option>
              <option value="distance">거리 가까운 순</option>
              <option value="price">가격 낮은 순</option>
              <option value="rating">평점 높은 순</option>
            </select>
          </div>
        ) : (
          <div className="sel-actions">
            <button
              className="sel-btn cancel"
              type="button"
              onClick={exitSelection}
              lang="ko"
            >
              취소
            </button>
            <button
              className="sel-btn"
              type="button"
              onClick={bulkUnsave}
              disabled={selectedIds.size === 0}
              lang="ko"
            >
              {selectedIds.size >= 1 ? "선택 삭제" : "전체 삭제"}
            </button>
            <a
              className="sel-btn primary"
              href={compareTarget}
              aria-disabled={selectedIds.size < 2}
              onClick={(e) => {
                if (selectedIds.size < 2) e.preventDefault();
              }}
              lang="ko"
            >
              비교하기 →
            </a>
          </div>
        )}
      </header>

      <section className="filter-bar" aria-label="카테고리 필터">
        {CAT_LABELS.map((c) => (
          <button
            key={c.key}
            className="filter-chip"
            type="button"
            aria-pressed={activeCat === c.key}
            onClick={() => setActiveCat(c.key)}
          >
            <span lang="ko">{c.label}</span>
            <span className="ct">{counts[c.key]}</span>
          </button>
        ))}
        <div className="filter-action">
          <button
            type="button"
            onClick={selectionMode ? exitSelection : enterSelection}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span lang="ko">{selectionMode ? "선택 종료" : "선택"}</span>
          </button>
          <a
            href={compareTarget}
            aria-disabled={selectedIds.size < 2}
            onClick={(e) => {
              if (selectedIds.size < 2) e.preventDefault();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 36,
              padding: "0 14px",
              background: "transparent",
              border: "1px solid #2B3450",
              borderRadius: 10,
              fontSize: 13,
              color: selectedIds.size < 2 ? "#ADB5BD" : "#1A2238",
              cursor: selectedIds.size < 2 ? "not-allowed" : "pointer",
              textDecoration: "none",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ width: 14, height: 14 }}
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span lang="ko">선택한 매장 비교</span>
          </a>
        </div>
      </section>

      <main id="grid" className="grid-wrap">
        {visibleStores.length === 0 ? (
          <p className="empty-state" lang="ko">
            저장한 매장이 없습니다.
          </p>
        ) : (
          <div className="grid">
            {visibleStores.map((s) => {
              const selected = selectedIds.has(s.id);
              return (
                <article
                  key={s.id}
                  className={selected ? "card is-selected" : "card"}
                  onClick={selectionMode ? () => toggleSelect(s.id) : undefined}
                  style={{ cursor: selectionMode ? "pointer" : undefined }}
                >
                  <div
                    className={`cover bg-${s.bg}`}
                    role="img"
                    aria-label={s.ariaLabel}
                  >
                    <button
                      className="heart"
                      type="button"
                      aria-pressed={true}
                      aria-label={`${s.nameKo} 저장 해제`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHeart(s.id);
                      }}
                    >
                      <HeartIcon />
                    </button>
                    <button
                      className="check-pip"
                      type="button"
                      aria-pressed={selected}
                      aria-label="선택 토글"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(s.id);
                      }}
                    >
                      {selected ? <CheckIcon /> : null}
                    </button>
                    {(s.badges.kVerified || s.badges.femaleFriendly) && (
                      <div className="cover-badges">
                        {s.badges.kVerified && (
                          <span className="k-badge">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            K-Verified
                          </span>
                        )}
                        {s.badges.femaleFriendly && (
                          <span className="dot-rose" lang="ko">
                            여성 친화
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="body">
                    <h2>
                      <span className="ko" lang="ko">
                        {s.nameKo}
                      </span>
                      <span className="en">{s.nameEn}</span>
                    </h2>
                    <p className="meta-line" lang="ko">
                      {s.catLabel}
                      <span className="sep">·</span>
                      {s.station}
                      <span className="sep">·</span>
                      <Range value={s.range} />
                    </p>
                    <p className="stat-line">
                      <StarIcon />
                      <span className="num">{s.rating.toFixed(1)}</span>
                      <span className="sub">· {s.reviews} reviews</span>
                      <span className="sep">·</span>
                      <span className="resp">{s.respMinutes} min</span>
                    </p>
                    <div className="tag-row">
                      {s.tags.map((t) => (
                        <span key={t.text} className="tag" lang={t.lang}>
                          {t.text}
                        </span>
                      ))}
                    </div>
                    <div className="card-cta">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          enterSelection();
                          toggleSelect(s.id);
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span lang="ko">비교</span>
                      </button>
                      <a
                        href={`/c/store/${s.id}/book/schedule`}
                        className="btn primary"
                        lang="ko"
                        onClick={(e) => e.stopPropagation()}
                      >
                        예약하기 →
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectionMode && (
        <div className="fab-bar" role="toolbar" aria-label="선택 일괄 작업">
          <span className="ct">
            <span className="num">{selectedIds.size}</span>
            <span lang="ko">개 선택됨</span>
          </span>
          <button
            type="button"
            className="del"
            onClick={bulkUnsave}
            disabled={selectedIds.size === 0}
            aria-label="선택 삭제"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
          <a
            className="cmp"
            href={compareTarget}
            aria-disabled={selectedIds.size < 2}
            onClick={(e) => {
              if (selectedIds.size < 2) e.preventDefault();
            }}
          >
            <span lang="ko">비교</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
