"use client";

/**
 * Store Holidays — 매장 휴무일 관리.
 * Reference: docs/design/reference/Hesya Store Holidays.html
 *
 * 베타 압축:
 *   - 한국 공휴일 2026 mock 8개 (auto)
 *   - 직접 추가 휴무 in-memory state (DB 신규 테이블 미존재)
 *   - 추가 dialog: 날짜 + 사유 + repeat (이번해/매년)
 *   - 추후 store_holidays 테이블 + DAL 도입 시 server-side.
 */

import { useState } from "react";

import { Link } from "@/i18n/navigation";

type Holiday = {
  id: string;
  date: string;
  name: string;
  source: "auto" | "custom";
  repeat?: "once" | "yearly";
};

const KR_HOLIDAYS_2026: Holiday[] = [
  {
    id: "k1",
    date: "2026-01-01",
    name: "신정",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k2",
    date: "2026-02-16",
    name: "설날 (구정)",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k3",
    date: "2026-02-17",
    name: "설날 연휴",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k4",
    date: "2026-03-01",
    name: "삼일절",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k5",
    date: "2026-05-05",
    name: "어린이날",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k6",
    date: "2026-06-06",
    name: "현충일",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k7",
    date: "2026-08-15",
    name: "광복절",
    source: "auto",
    repeat: "yearly",
  },
  {
    id: "k8",
    date: "2026-10-03",
    name: "개천절",
    source: "auto",
    repeat: "yearly",
  },
];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

export function HolidaysView() {
  const [customs, setCustoms] = useState<Holiday[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftRepeat, setDraftRepeat] = useState<"once" | "yearly">("once");

  function addCustom() {
    if (!draftDate || !draftName) return;
    setCustoms((cur) => [
      ...cur,
      {
        id: crypto.randomUUID(),
        date: draftDate,
        name: draftName,
        source: "custom",
        repeat: draftRepeat,
      },
    ]);
    setDraftDate("");
    setDraftName("");
    setDraftRepeat("once");
    setDialogOpen(false);
  }

  function removeCustom(id: string) {
    setCustoms((cur) => cur.filter((h) => h.id !== id));
  }

  const all = [...KR_HOLIDAYS_2026, ...customs].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <div className="holidays-page">
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
            휴무일
          </span>
        </nav>
        <h1>
          <span className="ko" lang="ko">
            영업시간 + 휴무
          </span>
        </h1>
        <span className="save-pill">SAVED</span>
      </header>

      <div className="shell">
        <div className="layout">
          <aside className="side-nav" aria-label="설정 메뉴">
            <div className="side-nav-h">매장 설정</div>
            <Link href="/store/settings/basic" className="side-link">
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
            <Link
              href="/store/holidays"
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
            <h2 className="section-h" id="kr-h">
              <span className="ko" lang="ko">
                한국 공휴일 자동 휴무
              </span>
              <span className="ct">KOREA HOLIDAYS · 2026</span>
            </h2>
            <div className="card" aria-labelledby="kr-h">
              <div className="card-h">
                <h3 lang="ko">자동 반영 · {KR_HOLIDAYS_2026.length}일</h3>
              </div>
              {KR_HOLIDAYS_2026.map((h) => (
                <div className="h-row" key={h.id}>
                  <div className="info">
                    <div className="name" lang="ko">
                      {h.name}
                    </div>
                    <div className="meta">{fmtDate(h.date)}</div>
                  </div>
                  <span className="tag auto" lang="ko">
                    AUTO
                  </span>
                </div>
              ))}
            </div>

            <h2 className="section-h" id="custom-h">
              <span className="ko" lang="ko">
                직접 추가한 휴무일
              </span>
            </h2>
            <div className="card" aria-labelledby="custom-h">
              <div className="card-h">
                <h3 lang="ko">{customs.length}일</h3>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => setDialogOpen(true)}
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
                  <span lang="ko">휴무일 추가</span>
                </button>
              </div>
              {customs.length === 0 ? (
                <p className="empty" lang="ko">
                  직접 추가한 휴무일이 없습니다.
                </p>
              ) : (
                customs.map((h) => (
                  <div className="h-row" key={h.id}>
                    <div className="info">
                      <div className="name" lang="ko">
                        {h.name}
                      </div>
                      <div className="meta">
                        {fmtDate(h.date)} ·{" "}
                        {h.repeat === "yearly" ? "매년 반복" : "이번해만"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rm"
                      aria-label={`${h.name} 삭제`}
                      onClick={() => removeCustom(h.id)}
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
                  </div>
                ))
              )}
            </div>

            <h2 className="section-h" id="all-h">
              <span className="ko" lang="ko">
                전체 휴무일 목록
              </span>
              <span className="ct">{all.length} ITEMS · SORTED BY DATE</span>
            </h2>
            <div className="card" aria-labelledby="all-h">
              {all.map((h) => (
                <div className="h-row" key={`all-${h.id}`}>
                  <div className="info">
                    <div className="name" lang="ko">
                      {h.name}
                    </div>
                    <div className="meta">{fmtDate(h.date)}</div>
                  </div>
                  <span
                    className={h.source === "auto" ? "tag auto" : "tag"}
                    lang="ko"
                  >
                    {h.source === "auto" ? "AUTO" : "CUSTOM"}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      <div
        className="dialog"
        data-open={dialogOpen ? "true" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-h"
      >
        <div className="dialog-card">
          <h2 id="add-h" lang="ko">
            휴무일 추가
          </h2>
          <label htmlFor="hd-name" lang="ko">
            사유
          </label>
          <input
            id="hd-name"
            type="text"
            placeholder="예: 가족 행사"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <label htmlFor="hd-date" lang="ko">
            날짜
          </label>
          <input
            id="hd-date"
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
          />
          <label htmlFor="hd-repeat" lang="ko">
            반복
          </label>
          <select
            id="hd-repeat"
            value={draftRepeat}
            onChange={(e) =>
              setDraftRepeat(e.target.value as "once" | "yearly")
            }
          >
            <option value="once">이번해만</option>
            <option value="yearly">매년 반복</option>
          </select>
          <div className="dialog-row">
            <button
              type="button"
              className="dialog-btn cancel"
              onClick={() => setDialogOpen(false)}
              lang="ko"
            >
              취소
            </button>
            <button
              type="button"
              className="dialog-btn primary"
              onClick={addCustom}
              disabled={!draftDate || !draftName}
              lang="ko"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
