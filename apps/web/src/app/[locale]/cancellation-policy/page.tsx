import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";

import { CancellationFaq } from "./CancellationFaq";
import "./cancellation-policy.css";

/**
 * /[locale]/cancellation-policy — 손님 + 매장 양쪽 모두에게 공정한 환불 정책.
 * Reference: docs/design/reference/Hesya Cancellation Policy.html
 *
 * 정적 페이지 — DB/auth 의존 없음. 법적 고지 + FAQ.
 */

export const metadata: Metadata = {
  title: "취소 및 환불 정책 · Hesya",
  description: "Hesya 예약 취소 및 환불 정책 — 손님과 매장 모두에게 공정한 룰.",
};

const REFUND_ROWS = [
  {
    whenKo: "예약 24시간 이전",
    whenEn: "More than 24h before",
    rate: "100%",
    rateClass: "full",
    rateLabel: "전액 환불",
    how: "자동 환불 — 카드사 기준 약 3 영업일 소요",
  },
  {
    whenKo: "예약 12시간 이전",
    whenEn: "12h to 24h before",
    rate: "50%",
    rateClass: "half",
    rateLabel: "절반 환불",
    how: "자동 환불 — 카드사 기준 약 3 영업일 소요",
  },
  {
    whenKo: "예약 당일",
    whenEn: "Less than 12h before",
    rate: "0%",
    rateClass: "none",
    rateLabel: "환불 없음",
    how: "노쇼 정책이 적용됩니다 (아래 참조)",
  },
];

const FAQ_ITEMS = [
  {
    q: "예약을 변경할 수 있나요?",
    a: "결제 완료 후 24시간 이전엔 매장 메시지로 변경 요청이 가능합니다. 매장이 확정하면 추가 결제 없이 일정만 바뀝니다.",
  },
  {
    q: "다른 카드로 결제 변경할 수 있나요?",
    a: "먼저 기존 결제를 환불받은 뒤, 새 결제수단으로 다시 예약하는 방식만 가능합니다. 직접 카드 교체는 지원하지 않습니다.",
  },
  {
    q: "외국 카드는 환불도 가능한가요?",
    a: "네, Stripe / Alipay / WeChat Pay 모두 자동 환불을 지원합니다. 결제 시 사용한 동일 수단으로만 환불됩니다.",
  },
  {
    q: "환불이 늦어지면 어떻게 하나요?",
    a: "5 영업일을 초과하시면 고객센터로 연락주시면 카드사 컨택을 도와드립니다. 환불 ID를 함께 알려주시면 더 빨라요.",
  },
  {
    q: "매장이 일방적으로 취소하면 어떻게 되나요?",
    a: "100% 즉시 환불됩니다. 같은 동네에서 비슷한 시술을 하는 다른 K-Verified 매장 추천도 함께 받으실 수 있습니다.",
  },
];

export default function CancellationPolicyPage() {
  return (
    <div className="cancel-page">
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="Hesya — 홈으로">
            Hesya<span className="brand-pill">·KR</span>
          </Link>
          <nav className="top-links" aria-label="주 메뉴">
            <Link href="/trending">Trending</Link>
            <Link href="/c">매장 찾기</Link>
            <Link href="/c/mypage">예약</Link>
          </nav>
          <div className="top-right">
            <button
              className="lang-pill"
              type="button"
              aria-label="언어 변경 — 현재 한국어"
            >
              <span aria-hidden="true">🌐</span> KO
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* §1 Hero */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero-wrap">
            <div className="eyebrow" aria-hidden="true">
              POLICY
            </div>
            <h1 id="hero-h">
              <span className="ko" lang="ko">
                취소 및 환불 정책
              </span>
            </h1>
            <p className="sub" lang="ko">
              예약 전 꼭 한번 확인해주세요. 손님과 매장 모두에게 공정합니다.
            </p>
            <p className="meta">Last updated · 2026-05-19 · v3.2</p>
          </div>
        </section>

        {/* §2 Refund table */}
        <section className="refund" aria-labelledby="refund-h">
          <div className="section-wrap">
            <h2 className="section-h" id="refund-h">
              <span className="ko" lang="ko">
                취소 시점별 환불
              </span>
            </h2>

            <table className="refund-table">
              <thead>
                <tr>
                  <th scope="col" className="col-when">
                    취소 시점
                  </th>
                  <th scope="col" className="col-rate">
                    환불 비율
                  </th>
                  <th scope="col" className="col-how">
                    환불 방식
                  </th>
                </tr>
              </thead>
              <tbody>
                {REFUND_ROWS.map((r) => (
                  <tr key={r.whenKo}>
                    <td className="col-when">
                      <div className="when-main" lang="ko">
                        {r.whenKo}
                      </div>
                      <div className="when-sub">{r.whenEn}</div>
                    </td>
                    <td className="col-rate">
                      <div className={`rate-num ${r.rateClass}`}>{r.rate}</div>
                      <div className="rate-label" lang="ko">
                        {r.rateLabel}
                      </div>
                    </td>
                    <td className="col-how" lang="ko">
                      {r.how}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="refund-cards" aria-hidden="false">
              {REFUND_ROWS.map((r) => (
                <article className="refund-card" key={r.whenKo}>
                  <div className="left">
                    <div className="when-main" lang="ko">
                      {r.whenKo}
                    </div>
                    <div className="when-sub">{r.whenEn}</div>
                    <p className="how" lang="ko">
                      {r.how}
                    </p>
                  </div>
                  <div className="right">
                    <div className={`rate-num ${r.rateClass}`}>{r.rate}</div>
                    <div className="rate-label" lang="ko">
                      {r.rateLabel}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* §3 How refunds work */}
        <section className="how" aria-labelledby="how-h">
          <div className="section-wrap">
            <h2 className="section-h" id="how-h">
              <span className="ko" lang="ko">
                환불은 이렇게 진행돼요
              </span>
            </h2>
            <div className="how-grid">
              <article className="how-card">
                <div className="icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h3 lang="ko">
                  <span className="step">01</span>자동 처리
                </h3>
                <p lang="ko">Hesya가 카드사로 자동 환불 요청을 전송합니다.</p>
              </article>
              <article className="how-card">
                <div className="icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                </div>
                <h3 lang="ko">
                  <span className="step">02</span>카드사 정산
                </h3>
                <p lang="ko">
                  카드사에서 결제 취소 후 약 3 영업일 내 환불이 표시됩니다.
                </p>
              </article>
              <article className="how-card">
                <div className="icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 lang="ko">
                  <span className="step">03</span>알림
                </h3>
                <p lang="ko">환불 완료 시 이메일과 앱 알림으로 안내드립니다.</p>
              </article>
            </div>
          </div>
        </section>

        {/* §4 No-show */}
        <section className="noshow" aria-labelledby="noshow-h">
          <div className="noshow-wrap">
            <h2 className="noshow-h" id="noshow-h">
              <span className="ko" lang="ko">
                노쇼 (예약 후 미방문)
              </span>
            </h2>
            <p className="noshow-body" lang="ko">
              예약 후 연락 없이 방문하지 않으시면 결제 금액의 100%가 차감되며,
              계정에 1회 노쇼가 기록됩니다. 3회 누적 시 예약이 제한됩니다.
              사유가 있으시면 매장 또는 Hesya <a href="#contact">고객센터 →</a>{" "}
              로 연락주세요. 가능한 한 양쪽 모두에게 공정한 해결을 도와드립니다.
            </p>
          </div>
        </section>

        {/* §5 FAQ */}
        <section className="faq" aria-labelledby="faq-h">
          <div className="faq-wrap">
            <h2 className="section-h" id="faq-h">
              <span className="ko" lang="ko">
                자주 묻는 질문
              </span>
            </h2>
            <CancellationFaq items={FAQ_ITEMS} />
          </div>
        </section>

        {/* §6 CTA */}
        <section className="cta-foot" id="contact" aria-labelledby="cta-h">
          <p id="cta-h" lang="ko">
            더 궁금하신 점이 있으세요?
          </p>
          <div className="cta-row">
            <Link href="/c/mypage" className="btn primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span lang="ko">고객센터 채팅</span>
            </Link>
            <a href="tel:+82212345678" className="btn ghost">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +82 2 1234 5678
            </a>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-wrap">
          <span>© 2026 Hesya · KR · GDPR · 개인정보보호법 준수</span>
          <Link href="/sign-in">Internal · Operations →</Link>
        </div>
      </footer>
    </div>
  );
}
