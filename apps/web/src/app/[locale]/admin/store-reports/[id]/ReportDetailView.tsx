"use client";

/**
 * Admin Store Reports Detail — 매장 신고 상세 + 조치 결정.
 * Reference: docs/design/reference/Hesya Admin Store Reports Detail.html
 *
 * 베타 압축:
 *   - 매장 프로필 + 누적 신고 3건 + 조치 이력
 *   - 조치 결정 패널 (A~F radio + 정지 기간 D-only)
 *   - 결정 사유 textarea (최소 50자 → 확정 enable)
 *   - 확인 modal (단순 confirm)
 *   - in-memory state. 추후 admin_actions 테이블 + Server Action.
 */

import { useState } from "react";

import { Link } from "@/i18n/navigation";

type ActionKey = "none" | "verbal" | "written" | "suspend" | "remove" | "more";
type SuspDays = "7d" | "14d" | "30d";

export function ReportDetailView({ id }: { id: string }) {
  const [action, setAction] = useState<ActionKey>("written");
  const [days, setDays] = useState<SuspDays>("14d");
  const [reason, setReason] = useState("");
  const [internal, setInternal] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const canSubmit = reason.length >= 50;

  return (
    <div className="report-detail-page">
      <header className="topbar" role="banner">
        <Link
          href="/admin/store-reports"
          className="back-btn"
          aria-label="목록으로 돌아가기"
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
        </Link>
        <div className="topbar-left">
          <nav className="crumb" aria-label="이동 경로">
            <Link href="/admin/store-reports">STORE REPORTS</Link>
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
              Stylista 홍대 · {id}
            </span>
          </nav>
          <div className="topbar-title">
            <span lang="ko">Stylista 홍대</span>
            <span className="sev-pill simgak" aria-label="심각도: 심각">
              SEVERE · 심각
            </span>
          </div>
        </div>
      </header>

      <div className="sev-strip" role="alert">
        <span className="lab">THRESHOLD</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span lang="ko">누적 신고 3건 도달 · 서면 경고 권장 기준</span>
        <span className="count">3 / 3 reports</span>
      </div>

      <div className="shell">
        <main>
          <section className="card" aria-labelledby="prof-h">
            <h2 className="card-h" id="prof-h">
              <span className="ko" lang="ko">
                매장 프로필
              </span>
              <span className="meta">STORE_ID · STY-HD-001</span>
            </h2>
            <div className="store-profile">
              <div className="sp-store">
                <div className="sp-thumb" aria-hidden="true" />
                <div>
                  <div className="name" lang="ko">
                    Stylista 홍대
                  </div>
                  <div className="loc" lang="ko">
                    홍대입구역 · Hongdae
                  </div>
                  <div className="joined">Joined 2024-03-12 · K-Verified</div>
                </div>
              </div>
              <div className="sp-stat">
                <span className="k">Total bookings</span>
                <span className="v">1,284</span>
                <span className="sub" lang="ko">
                  최근 12개월
                </span>
              </div>
              <div className="sp-stat">
                <span className="k">Rating</span>
                <span className="v">4.6</span>
                <span className="sub" lang="ko">
                  ★★★★★
                </span>
              </div>
              <div className="sp-stat">
                <span className="k">Reports (cumulative)</span>
                <span className="v warn">3</span>
                <span className="sub" lang="ko">
                  전 분기 대비 +2
                </span>
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="rep-h">
            <h2 className="card-h" id="rep-h">
              <span className="ko" lang="ko">
                신고 이력
              </span>
              <span className="meta">3 REPORTS · NEWEST FIRST</span>
            </h2>
            <div className="reports-list">
              <article className="report-card recent">
                <div className="report-head">
                  <div className="report-meta">
                    <span className="report-when">2025-11-28</span>
                    <span className="report-by">
                      <span lang="ko">신고자</span> · Sakura T.{" "}
                      <span className="masked">(****@gmail.com)</span>
                    </span>
                  </div>
                  <span className="cat-chip danger" lang="ko">
                    시술 품질
                  </span>
                  <span className="report-status review" lang="ko">
                    검토 중
                  </span>
                </div>
                <div className="quote-box customer">
                  <span className="party">CUSTOMER · JA</span>
                  <p className="orig" lang="ja">
                    施術後、髪が思っていたよりかなり短く切られました。希望した長さと違います。
                  </p>
                  <p className="tr" lang="ko">
                    번역: 시술 후 머리가 생각보다 너무 짧게 잘렸어요. 요청한
                    길이와 다릅니다.
                  </p>
                </div>
                <div className="quote-box store">
                  <span className="party">STORE RESPONSE</span>
                  <p lang="ko">
                    고객이 채팅에서 요청한 길이(쇄골 위 2cm)대로 시술했으며,
                    시술 전/후 사진 증빙 보유. 시술 중 컨펌도 받았습니다.
                  </p>
                </div>
              </article>

              <article className="report-card">
                <div className="report-head">
                  <div className="report-meta">
                    <span className="report-when">2025-10-22</span>
                    <span className="report-by">
                      <span lang="ko">신고자</span> · Mei Ling C.{" "}
                      <span className="masked">(meil***@yahoo.com)</span>
                    </span>
                  </div>
                  <span className="cat-chip warn" lang="ko">
                    시술 품질
                  </span>
                  <span className="report-status warned" lang="ko">
                    서면 경고
                  </span>
                </div>
                <div className="quote-box customer">
                  <span className="party">CUSTOMER · EN</span>
                  <p>
                    Color came out completely different from the reference
                    photo. Staff insisted it was correct. Did not feel
                    respected.
                  </p>
                  <p className="tr" lang="ko">
                    번역: 컬러가 레퍼런스 사진과 완전히 다르게 나왔어요. 직원이
                    맞다고 우겨서 존중받지 못한다는 느낌.
                  </p>
                </div>
                <div className="quote-box store">
                  <span className="party">STORE RESPONSE</span>
                  <p lang="ko">
                    사용한 컬러 톤은 요청 사진 기준 가장 유사한 것이었으나, 모발
                    베이스 차이를 사전 설명하지 못한 점 인정. 재시술 50% 할인
                    제안했으나 거절.
                  </p>
                </div>
              </article>

              <article className="report-card">
                <div className="report-head">
                  <div className="report-meta">
                    <span className="report-when">2025-09-15</span>
                    <span className="report-by">
                      <span lang="ko">신고자</span> · Aoi T.{" "}
                      <span className="masked">(aoi***@docomo.ne.jp)</span>
                    </span>
                  </div>
                  <span className="cat-chip" lang="ko">
                    응답 지연
                  </span>
                  <span className="report-status warned" lang="ko">
                    구두 경고
                  </span>
                </div>
                <div className="quote-box customer">
                  <span className="party">CUSTOMER · JA</span>
                  <p className="orig" lang="ja">
                    予約のメッセージを送って3日以上返事がありませんでした。結局他のサロンを予約しました。
                  </p>
                  <p className="tr" lang="ko">
                    번역: 예약 메시지 보내고 3일 넘게 답장이 없었어요. 결국 다른
                    매장 예약했습니다.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="card" aria-labelledby="act-h">
            <h2 className="card-h" id="act-h">
              <span className="ko" lang="ko">
                조치 이력
              </span>
              <span className="meta">HESYA HQ · STORE TIMELINE</span>
            </h2>
            <div className="action-tl" role="list">
              <div className="action-row l1" role="listitem">
                <span className="date">2025-09-15</span>
                <span className="dot" aria-hidden="true" />
                <span className="what">
                  <span className="strong" lang="ko">
                    구두 경고 1차
                  </span>
                  <span className="sub" lang="ko">
                    응답 지연 누적 · 매장 응답 시간 SLA 위반
                  </span>
                </span>
                <span className="admin-tag">@kim_jisoo</span>
              </div>
              <div className="action-row l2" role="listitem">
                <span className="date">2025-10-22</span>
                <span className="dot" aria-hidden="true" />
                <span className="what">
                  <span className="strong" lang="ko">
                    서면 경고 2차
                  </span>
                  <span className="sub" lang="ko">
                    시술 품질 불만 · 정지 임계치까지 1건 남음
                  </span>
                </span>
                <span className="admin-tag">@park_minseong</span>
              </div>
              <div className="action-row now" role="listitem">
                <span className="date">2025-11-28</span>
                <span className="dot" aria-hidden="true" />
                <span className="what">
                  <span className="strong" lang="ko">
                    현재 검토 중
                  </span>
                  <span className="sub" lang="ko">
                    누적 3건 도달 · 서면 경고 또는 일시 정지 결정 필요
                  </span>
                </span>
                <span className="admin-tag">@you</span>
              </div>
            </div>
          </section>
        </main>

        <aside className="decision" aria-label="조치 결정 패널">
          <h2 className="decision-h">
            <span className="ko" lang="ko">
              조치 결정
            </span>
          </h2>
          <p className="decision-sub" lang="ko">
            매장에 대한 운영 조치를 선택해주세요. 결정은 매장에 통보되며 감사
            로그에 영구 기록됩니다.
          </p>

          <div className="matrix" role="region" aria-label="권장 조치 매트릭스">
            <p className="matrix-h">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Severity matrix · 권장 조치
            </p>
            <div className="matrix-row active">
              <span lang="ko">누적 신고 3건 도달</span>
              <span className="rec">→ C 권장</span>
            </div>
            <div className="matrix-row">
              <span lang="ko">누적 5건 또는 심각 신고 1건</span>
              <span className="rec">→ D 권장</span>
            </div>
            <div className="matrix-row">
              <span lang="ko">결제 사기 / 안전 사고</span>
              <span className="rec">→ E (즉시)</span>
            </div>
          </div>

          <div className="opts" role="radiogroup" aria-label="조치 옵션">
            {(
              [
                {
                  key: "none",
                  letter: "A",
                  title: "A. 무혐의 종결",
                  sub: "조치 없음 · 신고 기각 · 매장 통보 없음",
                },
                {
                  key: "verbal",
                  letter: "B",
                  title: "B. 구두 경고",
                  sub: "매장 대시보드 알림만 발송 · 정지 임계 누적 안 됨",
                },
                {
                  key: "written",
                  letter: "C",
                  title: "C. 서면 경고",
                  sub: "정식 경고 발송 · 누적 시 정지 임계치 산정 · 30일 추적",
                  badge: "+1 STRIKE",
                  reco: true,
                },
                {
                  key: "suspend",
                  letter: "D",
                  title: "D. 일시 정지",
                  sub: "신규 예약 차단 · 기존 예약은 유지 · 기간 선택",
                  badge: "SUSPEND",
                },
                {
                  key: "remove",
                  letter: "E",
                  title: "E. 영구 제거",
                  sub: "계정 영구 차단 · 검색 노출 제외 · 운영자 2명 동시 서명 필요",
                  badge: "PERMANENT",
                },
                {
                  key: "more",
                  letter: "F",
                  title: "F. 추가 조사 필요",
                  sub: "양측에 추가 증빙 요청 · SLA 7일 연장 · 조사 완료 후 재결정",
                },
              ] as const
            ).map((o) => (
              <label
                key={o.key}
                className={`opt ${o.letter.toLowerCase()}${
                  action === o.key ? " is-selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={o.key}
                  checked={action === o.key}
                  onChange={() => setAction(o.key)}
                  className="sr-only"
                  style={{ position: "absolute", left: "-9999px" }}
                />
                <span className="opt-row">
                  <span className="pip" aria-hidden="true" />
                  <span>
                    <span className="title">
                      <span lang="ko">{o.title}</span>
                      {"badge" in o && o.badge ? (
                        <span className="badge">{o.badge}</span>
                      ) : null}
                      {"reco" in o && o.reco ? (
                        <span className="reco">RECOMMENDED</span>
                      ) : null}
                    </span>
                    <span className="sub" lang="ko">
                      {o.sub}
                    </span>
                    {o.key === "suspend" && action === "suspend" ? (
                      <div
                        role="radiogroup"
                        aria-label="정지 기간"
                        style={{
                          display: "flex",
                          gap: 6,
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px dashed rgba(220,38,38,0.3)",
                        }}
                      >
                        {(["7d", "14d", "30d"] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={days === d}
                            onClick={(e) => {
                              e.preventDefault();
                              setDays(d);
                            }}
                            style={{
                              flex: 1,
                              height: 34,
                              border: "1px solid #f5ddd7",
                              background: days === d ? "#dc2626" : "#fff",
                              color: days === d ? "#fff" : "#991b1b",
                              borderRadius: 8,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="dec-field">
            <label htmlFor="reason">
              <span className="lab" lang="ko">
                결정 사유<span className="req">*</span> · 매장에 공개
              </span>
              <span className="ct">{reason.length} / 800</span>
            </label>
            <textarea
              id="reason"
              maxLength={800}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이 조치의 근거를 자세히 적어주세요. 매장이 읽고 이해할 수 있어야 합니다. (최소 50자)"
              lang="ko"
            />
          </div>

          <div className="dec-field">
            <label htmlFor="internal">
              <span className="lab" lang="ko">
                내부 메모 · admin only
              </span>
            </label>
            <textarea
              id="internal"
              value={internal}
              onChange={(e) => setInternal(e.target.value)}
              placeholder="운영자만 볼 수 있는 메모..."
              lang="ko"
            />
          </div>

          <div className="dec-foot">
            <button type="button" className="btn-ghost" lang="ko">
              임시 저장
            </button>
            <button
              type="button"
              className="btn-final"
              disabled={!canSubmit}
              onClick={() => setModalOpen(true)}
            >
              <span lang="ko">조치 확정</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </aside>
      </div>

      {modalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="조치 확정"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,30,36,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 100,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: 24,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 22,
                margin: "0 0 16px",
              }}
            >
              <span className="ko" lang="ko">
                조치를 확정하시겠습니까?
              </span>
            </h2>
            <p
              lang="ko"
              style={{ color: "#6c757d", fontSize: 13, lineHeight: 1.6 }}
            >
              이 조치는 매장 대시보드 알림 및 이메일로 즉시 통보됩니다. 누적 5건
              도달 시 자동으로 일시 정지 임계 도달 알림이 운영팀에 전송됩니다.
              감사 로그에 영구 기록.
            </p>
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                paddingTop: 18,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: "0 0 auto", padding: "0 18px" }}
                onClick={() => setModalOpen(false)}
                lang="ko"
              >
                다시 검토
              </button>
              <button
                type="button"
                className="btn-final"
                style={{ flex: "0 0 auto", padding: "0 18px" }}
                onClick={() => setModalOpen(false)}
                lang="ko"
              >
                확정 + 통보
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
