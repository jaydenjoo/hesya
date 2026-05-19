"use client";

/**
 * Store Settings Basic — 매장 기본 정보 관리.
 * Reference: docs/design/reference/Hesya Store Settings Basic.html
 *
 * 베타 압축:
 *   - 식별 (이름 ko/en, 카테고리, 전화, 이메일)
 *   - 주소 (DAUM POSTCODE 자리만, 베타는 manual 입력)
 *   - 사진 5슬롯 (filled 3 + empty 2, mock placeholder)
 *   - 소개 6 locale tabs (ko/en/ja/zh/vi/th), textarea
 *   - in-memory state. 추후 store_basic 저장 시 Server Action.
 */

import { useState } from "react";

import { Link } from "@/i18n/navigation";

const CATEGORIES = [
  "헤어",
  "네일",
  "래쉬",
  "메이크업",
  "스킨",
  "왁싱",
  "마사지",
] as const;
type Category = (typeof CATEGORIES)[number];

type LocaleKey = "ko" | "en" | "ja" | "zh" | "vi" | "th";
const LOCALES: { key: LocaleKey; label: string; required: boolean }[] = [
  { key: "ko", label: "한국어 KO", required: true },
  { key: "en", label: "ENGLISH EN", required: true },
  { key: "ja", label: "日本語 JA", required: false },
  { key: "zh", label: "中文 ZH", required: false },
  { key: "vi", label: "TIẾNG VIỆT VI", required: false },
  { key: "th", label: "ภาษาไทย TH", required: false },
];

export function BasicView() {
  const [nameKo, setNameKo] = useState("스타일리스타 홍대");
  const [nameEn, setNameEn] = useState("Stylista Hongdae");
  const [cats, setCats] = useState<Category[]>(["헤어", "메이크업"]);
  const [phone, setPhone] = useState("02-555-1234");
  const [email, setEmail] = useState("hongdae@stylista.kr");
  const [zip, setZip] = useState("04042");
  const [road, setRoad] = useState("서울 마포구 양화로 100");
  const [detail, setDetail] = useState("3층 301호");
  const [station, setStation] = useState("홍대입구역 9번 출구 도보 3분");
  const [parking, setParking] = useState<"none" | "free" | "paid">("paid");
  const [locale, setLocale] = useState<LocaleKey>("ko");
  const [desc, setDesc] = useState<Record<LocaleKey, string>>({
    ko: "홍대 한가운데 위치한 K-뷰티 살롱. 외국인 손님 환영 — 영어/일본어/중국어 가능합니다.",
    en: "K-beauty salon in the heart of Hongdae. International guests welcome — we speak English, Japanese, Chinese.",
    ja: "",
    zh: "",
    vi: "",
    th: "",
  });

  function toggleCat(c: Category) {
    setCats((cur) => {
      if (cur.includes(c)) return cur.filter((x) => x !== c);
      if (cur.length >= 3) return cur;
      return [...cur, c];
    });
  }

  return (
    <div className="settings-basic-page">
      <header className="topbar" role="banner">
        <Link href="/store/settings" className="back-btn" aria-label="설정으로">
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
        <nav className="crumb" aria-label="이동 경로">
          <Link href="/store/settings">설정</Link>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="cur" lang="ko">
            기본 정보
          </span>
        </nav>
        <h1>
          <span className="ko" lang="ko">
            기본 정보
          </span>
        </h1>
        <button type="button" className="save-btn">
          <span lang="ko">변경사항 저장</span>
        </button>
      </header>

      <div className="shell">
        <div className="layout">
          <aside className="side-nav" aria-label="설정 메뉴">
            <div className="side-nav-h">매장 설정</div>
            <Link
              href="/store/settings/basic"
              className="side-link active"
              aria-current="page"
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
                <circle cx="12" cy="7" r="3" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
              <span lang="ko">기본 정보</span>
            </Link>
            <Link href="/store/holidays" className="side-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              <span lang="ko">영업시간 + 휴무</span>
            </Link>
            <Link href="/store/settings" className="side-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span lang="ko">전체 설정</span>
            </Link>
          </aside>

          <main>
            <h2 className="section-h">
              <span className="ko" lang="ko">
                매장 식별
              </span>
            </h2>
            <section className="card" aria-label="매장 식별">
              <div className="card-h">
                <h2 lang="ko">
                  기본 정보
                  <span className="req">REQUIRED · 필수</span>
                </h2>
                <span className="badge">SECTION 1 / 4</span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="name-ko" lang="ko">
                  매장 이름 (한국어)
                </label>
                <input
                  id="name-ko"
                  type="text"
                  value={nameKo}
                  onChange={(e) => setNameKo(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="name-en">
                  Salon name (English)
                </label>
                <input
                  id="name-en"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  maxLength={40}
                />
                <p className="field-help" lang="ko">
                  외국인 손님 검색에 사용됩니다.
                </p>
              </div>

              <div className="field">
                <span className="field-label" lang="ko">
                  시술 카테고리 (최대 3개)
                  <span className="field-counter">{cats.length} / 3</span>
                </span>
                <div
                  className="cat-pills"
                  role="group"
                  aria-label="시술 카테고리"
                >
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="cat-pill"
                      aria-pressed={cats.includes(c)}
                      onClick={() => toggleCat(c)}
                      lang="ko"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="phone" lang="ko">
                  대표 전화
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="email">
                  Contact email
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </section>

            <h2 className="section-h">
              <span className="ko" lang="ko">
                주소
              </span>
            </h2>
            <section className="card" aria-label="주소">
              <div className="card-h">
                <h2 lang="ko">
                  매장 위치
                  <span className="req">REQUIRED · 필수</span>
                </h2>
                <span className="badge">DAUM POSTCODE · 베타 manual</span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="zip" lang="ko">
                  우편번호
                </label>
                <input
                  id="zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="road" lang="ko">
                  도로명 주소
                </label>
                <input
                  id="road"
                  type="text"
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="detail" lang="ko">
                  상세 주소
                </label>
                <input
                  id="detail"
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="station" lang="ko">
                  가장 가까운 지하철역
                </label>
                <input
                  id="station"
                  type="text"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="parking" lang="ko">
                  주차
                </label>
                <select
                  id="parking"
                  value={parking}
                  onChange={(e) =>
                    setParking(e.target.value as "none" | "free" | "paid")
                  }
                >
                  <option value="none">불가</option>
                  <option value="free">무료 가능</option>
                  <option value="paid">유료 가능</option>
                </select>
              </div>
            </section>

            <h2 className="section-h">
              <span className="ko" lang="ko">
                매장 사진
              </span>
            </h2>
            <section className="card" aria-label="매장 사진">
              <div className="card-h">
                <h2 lang="ko">사진 (최대 5장)</h2>
                <span className="badge">3 / 5 UPLOADED</span>
              </div>
              <div className="photos-grid">
                <div
                  className="photo-slot filled p1"
                  role="img"
                  aria-label="대표 사진"
                />
                <div
                  className="photo-slot filled p2"
                  role="img"
                  aria-label="추가 사진 1"
                />
                <div
                  className="photo-slot filled p3"
                  role="img"
                  aria-label="추가 사진 2"
                />
                <button
                  type="button"
                  className="photo-slot"
                  aria-label="추가 사진 업로드 (슬롯 4)"
                >
                  <span lang="ko">+ 추가</span>
                </button>
                <button
                  type="button"
                  className="photo-slot"
                  aria-label="추가 사진 업로드 (슬롯 5)"
                >
                  <span lang="ko">+ 추가</span>
                </button>
              </div>
            </section>

            <h2 className="section-h">
              <span className="ko" lang="ko">
                매장 소개
              </span>
            </h2>
            <section className="card" aria-label="매장 소개">
              <div className="card-h">
                <h2 lang="ko">소개 글</h2>
                <span className="badge">6 LOCALES · KO/EN 필수</span>
              </div>
              <div
                className="locale-tabs"
                role="tablist"
                aria-label="언어 선택"
              >
                {LOCALES.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    role="tab"
                    className="locale-tab"
                    aria-selected={locale === l.key}
                    onClick={() => setLocale(l.key)}
                  >
                    {l.label}
                    {l.required ? " *" : ""}
                  </button>
                ))}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="desc" lang="ko">
                  {LOCALES.find((l) => l.key === locale)?.label} 소개
                  <span className="field-counter">
                    {desc[locale].length} / 500
                  </span>
                </label>
                <textarea
                  id="desc"
                  value={desc[locale]}
                  maxLength={500}
                  onChange={(e) =>
                    setDesc((cur) => ({ ...cur, [locale]: e.target.value }))
                  }
                />
              </div>
              <div className="ai-helper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span lang="ko">
                  한국어를 입력하시면 AI가 다른 언어로 자동 번역 초안을
                  제안합니다.
                </span>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
