"use client";

/**
 * Customer Compare — 3 매장 시술/결제/신뢰 비교.
 * Reference: docs/design/reference/Hesya Customer Compare.html
 *
 * 베타: MOCK 3개 매장 (URL ?ids= ignore, 데모 데이터 사용).
 */

import { useState } from "react";

import { Link } from "@/i18n/navigation";

type StoreCompare = {
  id: string;
  thumbClass: "t-styl" | "t-mirr" | "t-colo";
  nameKo: string;
  loc: string;
  rating: number;
  reviews: number;
  rangeClass: "low" | "mid" | "high";
  rangeFilled: number;
  foreignSupport: "full" | "partial";
  duration: string;
  station: string;
  metroLine: "l2" | "l3";
  kVerified: boolean;
  insurance: boolean;
  femaleFriendly: boolean;
  payments: { text: string; lang?: "ko" }[];
  hours: string;
  langs: string[];
  sameDay: boolean;
  sameDayLabel: string;
  avgResp: string;
  services: string;
};

const STORES: StoreCompare[] = [
  {
    id: "s1",
    thumbClass: "t-styl",
    nameKo: "Stylista 홍대",
    loc: "Hongdae",
    rating: 4.9,
    reviews: 312,
    rangeClass: "mid",
    rangeFilled: 3,
    foreignSupport: "full",
    duration: "60–90 min",
    station: "홍대입구",
    metroLine: "l2",
    kVerified: true,
    insurance: true,
    femaleFriendly: true,
    payments: [{ text: "Stripe" }, { text: "Alipay" }, { text: "WeChat" }],
    hours: "10:00 – 21:00",
    langs: ["EN", "JA", "ZH"],
    sameDay: true,
    sameDayLabel: "가능",
    avgResp: "2 min",
    services: "24 services",
  },
  {
    id: "s2",
    thumbClass: "t-mirr",
    nameKo: "Mirror Glass 성수",
    loc: "Seongsu",
    rating: 4.7,
    reviews: 184,
    rangeClass: "low",
    rangeFilled: 2,
    foreignSupport: "partial",
    duration: "45–60 min",
    station: "성수",
    metroLine: "l2",
    kVerified: false,
    insurance: true,
    femaleFriendly: false,
    payments: [{ text: "Stripe" }, { text: "현금", lang: "ko" }],
    hours: "11:00 – 20:00",
    langs: ["EN"],
    sameDay: true,
    sameDayLabel: "가능",
    avgResp: "8 min",
    services: "11 services",
  },
  {
    id: "s3",
    thumbClass: "t-colo",
    nameKo: "Color Lab 강남",
    loc: "Gangnam",
    rating: 4.8,
    reviews: 256,
    rangeClass: "high",
    rangeFilled: 4,
    foreignSupport: "full",
    duration: "120–180 min",
    station: "신사",
    metroLine: "l3",
    kVerified: true,
    insurance: true,
    femaleFriendly: true,
    payments: [
      { text: "Stripe" },
      { text: "Alipay" },
      { text: "WeChat" },
      { text: "현금", lang: "ko" },
    ],
    hours: "10:00 – 22:00",
    langs: ["EN", "JA", "ZH", "VI"],
    sameDay: false,
    sameDayLabel: "48h 전 예약",
    avgResp: "3 min",
    services: "38 services",
  },
];

function CheckIcon() {
  return (
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
  );
}
function MissIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
function HalfIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10V2z" />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function Range({ filled, klass }: { filled: number; klass: string }) {
  const filledStr = "₩".repeat(filled);
  const fadeStr = "₩".repeat(4 - filled);
  return (
    <span className={`range-mono ${klass}`}>
      {filledStr}
      {fadeStr && <span className="fade">{fadeStr}</span>}
    </span>
  );
}

function ForeignCell({ value }: { value: "full" | "partial" }) {
  if (value === "full") {
    return (
      <div className="check">
        <CheckIcon />
        <span lang="ko">전체 지원</span>
      </div>
    );
  }
  return (
    <div className="half">
      <HalfIcon />
      <span lang="ko">부분 지원</span>
    </div>
  );
}

export function CompareView() {
  const [active, setActive] = useState<string>(STORES[0].id);

  return (
    <div className="compare-page">
      <header className="topbar" role="banner">
        <Link href="/c/saved" className="back-btn" aria-label="뒤로 가기">
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
          <Link href="/c/saved" lang="ko">
            저장
          </Link>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="cur" lang="ko">
            비교
          </span>
        </nav>
        <h1>
          <span className="ko" lang="ko">
            매장 비교
          </span>
        </h1>
        <button
          className="share-btn"
          type="button"
          aria-label="비교 페이지 URL 공유"
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
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span lang="ko">공유</span>
        </button>
      </header>

      <section className="selector-bar" aria-label="비교할 매장">
        <div className="selector-bar-inner">
          {STORES.map((s) => (
            <div className="store-chip" key={s.id}>
              <div className={`thumb ${s.thumbClass}`} aria-hidden="true" />
              <div className="meta">
                <div className="name" lang="ko">
                  {s.nameKo}
                </div>
                <div className="loc">{s.loc}</div>
              </div>
              <button
                className="rm"
                type="button"
                aria-label={`${s.nameKo} 비교에서 제거`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          <button
            className="add-slot"
            type="button"
            aria-label="비교할 매장 추가"
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
            <span lang="ko">매장 추가</span>
          </button>
        </div>
      </section>

      <main className="compare">
        <div className="compare-wrap">
          <div className="compare-h">
            <h2>
              <span className="ko" lang="ko">
                시술 / 결제 / 신뢰 비교
              </span>
            </h2>
            <span className="meta">3 stores · Updated 2 days ago</span>
          </div>

          {/* Desktop grid */}
          <div className="cmp-table" role="table" aria-label="매장 비교표">
            <div className="cell head-label" role="rowheader">
              매장
            </div>
            {STORES.map((s) => (
              <div key={s.id} className="cell head" role="columnheader">
                <div className={`thumb ${s.thumbClass}`} aria-hidden="true" />
                <div className="info">
                  <div className="name">
                    <span lang="ko">{s.nameKo}</span>
                  </div>
                  <div className="stars">
                    <StarIcon />
                    <span>
                      {s.rating.toFixed(1)} · {s.reviews} reviews
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="cell group">
              <span lang="ko">기본 정보</span>
            </div>

            <div className="cell label" lang="ko">
              가격대
            </div>
            {STORES.map((s) => (
              <div key={`p-${s.id}`} className="cell">
                <Range filled={s.rangeFilled} klass={s.rangeClass} />
              </div>
            ))}

            <div className="cell label" lang="ko">
              외국인 응대
            </div>
            {STORES.map((s) => (
              <div key={`f-${s.id}`} className="cell">
                <ForeignCell value={s.foreignSupport} />
              </div>
            ))}

            <div className="cell label" lang="ko">
              시술 시간
            </div>
            {STORES.map((s) => (
              <div key={`d-${s.id}`} className="cell">
                <span className="mono">{s.duration}</span>
              </div>
            ))}

            <div className="cell label" lang="ko">
              위치
            </div>
            {STORES.map((s) => (
              <div key={`l-${s.id}`} className="cell">
                <span className="metro">
                  <span className={`line ${s.metroLine}`}>
                    {s.metroLine === "l2" ? 2 : 3}
                  </span>
                  <span lang="ko">{s.station}</span>
                </span>
              </div>
            ))}

            <div className="cell label" lang="ko">
              평점
            </div>
            {STORES.map((s) => (
              <div key={`r-${s.id}`} className="cell">
                <span className="rating">
                  <span className="num">{s.rating.toFixed(1)}</span>
                  <span className="stars-row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} />
                    ))}
                  </span>
                  <span className="count">{s.reviews}</span>
                </span>
              </div>
            ))}

            <div className="cell group">
              <span lang="ko">신뢰 + 인증</span>
            </div>

            <div className="cell label" lang="ko">
              인증
            </div>
            {STORES.map((s) => (
              <div key={`k-${s.id}`} className="cell">
                {s.kVerified ? (
                  <span className="k-badge">
                    <CheckIcon />
                    K-Verified
                  </span>
                ) : (
                  <div className="miss">
                    <MissIcon />
                    <span lang="ko">미인증</span>
                  </div>
                )}
              </div>
            ))}

            <div className="cell label" lang="ko">
              보험
            </div>
            {STORES.map((s) => (
              <div key={`ins-${s.id}`} className="cell">
                {s.insurance ? (
                  <div className="check">
                    <CheckIcon />
                    <span lang="ko">가입</span>
                  </div>
                ) : (
                  <div className="miss">
                    <MissIcon />
                  </div>
                )}
              </div>
            ))}

            <div className="cell label" lang="ko">
              Female-Friendly
            </div>
            {STORES.map((s) => (
              <div key={`ff-${s.id}`} className="cell">
                {s.femaleFriendly ? (
                  <span className="dot-rose" lang="ko">
                    여성 친화
                  </span>
                ) : (
                  <div className="miss">
                    <MissIcon />
                  </div>
                )}
              </div>
            ))}

            <div className="cell group">
              <span lang="ko">결제 + 예약</span>
            </div>

            <div className="cell label" lang="ko">
              결제 수단
            </div>
            {STORES.map((s) => (
              <div key={`pay-${s.id}`} className="cell">
                <div className="chip-row">
                  {s.payments.map((p) => (
                    <span key={p.text} className="chip" lang={p.lang}>
                      {p.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="cell label" lang="ko">
              영업시간
            </div>
            {STORES.map((s) => (
              <div key={`h-${s.id}`} className="cell">
                <span className="mono">{s.hours}</span>
              </div>
            ))}

            <div className="cell label" lang="ko">
              외국어 응대
            </div>
            {STORES.map((s) => (
              <div key={`lg-${s.id}`} className="cell">
                <div className="chip-row">
                  {s.langs.map((l) => (
                    <span key={l} className="chip">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="cell label" lang="ko">
              당일 예약
            </div>
            {STORES.map((s) => (
              <div key={`sd-${s.id}`} className="cell">
                {s.sameDay ? (
                  <div className="check">
                    <CheckIcon />
                    <span lang="ko">{s.sameDayLabel}</span>
                  </div>
                ) : (
                  <div className="miss">
                    <MissIcon />
                    <span lang="ko">{s.sameDayLabel}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="cell group">
              <span lang="ko">기타</span>
            </div>

            <div className="cell label" lang="ko">
              평균 응답 시간
            </div>
            {STORES.map((s) => (
              <div key={`ar-${s.id}`} className="cell">
                <span className="mono">{s.avgResp}</span>
              </div>
            ))}

            <div className="cell label" lang="ko">
              시술 메뉴 수
            </div>
            {STORES.map((s) => (
              <div key={`sv-${s.id}`} className="cell">
                <span className="mono">{s.services}</span>
              </div>
            ))}
          </div>

          {/* Desktop CTA strip */}
          <div className="cta-strip" aria-label="매장별 예약">
            <div className="cell" lang="ko">
              예약하기
            </div>
            {STORES.map((s) => (
              <div key={`cta-${s.id}`} className="cell">
                <Link
                  href={`/c/store/${s.id}/book/schedule`}
                  className="btn primary"
                  lang="ko"
                >
                  이 매장 예약 →
                </Link>
                <Link href={`/c/store/${s.id}`} className="btn ghost" lang="ko">
                  상세 보기
                </Link>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="cmp-mobile">
            <div
              className="mob-tabs"
              role="tablist"
              aria-label="비교할 매장 전환"
            >
              {STORES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active === s.id}
                  onClick={() => setActive(s.id)}
                >
                  <span
                    className={`thumb ${s.thumbClass}`}
                    aria-hidden="true"
                  />
                  <span lang="ko">{s.nameKo}</span>
                </button>
              ))}
            </div>
            {STORES.map((s) => {
              if (s.id !== active) return null;
              return (
                <div className="mob-card" key={s.id}>
                  <div className="mob-store-head">
                    <div
                      className={`thumb ${s.thumbClass}`}
                      aria-hidden="true"
                    />
                    <div className="info">
                      <div className="name" lang="ko">
                        {s.nameKo}
                      </div>
                      <div className="stars">
                        {s.rating.toFixed(1)} · {s.reviews} reviews
                        {s.kVerified ? " · K-Verified" : ""}
                      </div>
                    </div>
                  </div>
                  <h3 className="mob-section-h">
                    <span className="ko" lang="ko">
                      기본 정보
                    </span>
                  </h3>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      가격대
                    </span>
                    <span className="v">
                      <Range filled={s.rangeFilled} klass={s.rangeClass} />
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      외국인 응대
                    </span>
                    <span className="v" lang="ko">
                      {s.foreignSupport === "full" ? "전체 지원" : "부분 지원"}
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      시술 시간
                    </span>
                    <span className="v">
                      <span className="mono">{s.duration}</span>
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      위치
                    </span>
                    <span className="v" lang="ko">
                      {s.station}역 ({s.metroLine === "l2" ? "2" : "3"}호선)
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      평점
                    </span>
                    <span className="v">
                      <span className="mono">{s.rating.toFixed(1)}</span> ·{" "}
                      {s.reviews}
                    </span>
                  </div>
                  <h3 className="mob-section-h">
                    <span className="ko" lang="ko">
                      신뢰 + 인증
                    </span>
                  </h3>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      인증
                    </span>
                    <span className="v">
                      {s.kVerified ? (
                        <span className="k-badge">K-Verified</span>
                      ) : (
                        <span lang="ko">미인증</span>
                      )}
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      보험
                    </span>
                    <span className="v" lang="ko">
                      {s.insurance ? "가입" : "미가입"}
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      Female-Friendly
                    </span>
                    <span className="v">
                      {s.femaleFriendly ? (
                        <span className="dot-rose" lang="ko">
                          여성 친화
                        </span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <h3 className="mob-section-h">
                    <span className="ko" lang="ko">
                      결제 + 예약
                    </span>
                  </h3>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      결제 수단
                    </span>
                    <span className="v">
                      {s.payments.map((p) => p.text).join(" · ")}
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      영업시간
                    </span>
                    <span className="v">
                      <span className="mono">{s.hours}</span>
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      외국어
                    </span>
                    <span className="v">{s.langs.join(" · ")}</span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      당일 예약
                    </span>
                    <span className="v" lang="ko">
                      {s.sameDayLabel}
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      평균 응답
                    </span>
                    <span className="v">
                      <span className="mono">{s.avgResp}</span>
                    </span>
                  </div>
                  <div className="mob-row">
                    <span className="k" lang="ko">
                      시술 메뉴
                    </span>
                    <span className="v">
                      <span className="mono">{s.services}</span>
                    </span>
                  </div>
                  <div className="mob-cta-row">
                    <Link
                      href={`/c/store/${s.id}/book/schedule`}
                      className="btn primary"
                      lang="ko"
                    >
                      이 매장 예약 →
                    </Link>
                    <Link
                      href={`/c/store/${s.id}`}
                      className="btn ghost"
                      lang="ko"
                    >
                      상세
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
