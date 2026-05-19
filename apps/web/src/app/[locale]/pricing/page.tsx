import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";

import { PricingFaq, PricingMobileCompare } from "./PricingInteractive";
import "./pricing.css";

/**
 * /[locale]/pricing — 베타 매장 6개월 무료 + Pro/Enterprise 플랜 안내.
 * Reference: docs/design/reference/Hesya Pricing.html (§1 Hero ~ §5 Trust+CTA).
 *
 * 정적 마케팅 페이지 — DB/auth 의존 없음. mock-mode 무관.
 */

export const metadata: Metadata = {
  title: "요금제 · Hesya — 외국인 손님 응대를 자동으로",
  description:
    "베타 매장 6개월 무료, Pro 월 ₩49,000부터. 외국인 손님 응대를 자동화하세요.",
};

const CHECK_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MISS_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
);

const FAQ_ITEMS = [
  {
    q: "베타가 끝나면 자동으로 유료 전환되나요?",
    a: "아니요. 베타 종료 30일 전 안내를 드리고, 사장님이 직접 Pro로 업그레이드하셔야 합니다. 자동 결제는 절대 없습니다.",
  },
  {
    q: "신용카드 등록 없이 시작할 수 있나요?",
    a: "네, Pro 14일 무료 체험은 카드 등록 없이 시작하실 수 있습니다. 체험 종료 후 결제 의사를 다시 확인드립니다.",
  },
  {
    q: "Pro에서 메시지가 100건 이하라면 다운그레이드 가능한가요?",
    a: "베타 매장 종료 후엔 Free 플랜이 사라집니다. 사용량이 적으시면 영업팀에 문의해주세요 — 사용량 기반 할인 플랜을 제안드립니다.",
  },
  {
    q: "환불 정책은 어떻게 되나요?",
    a: "결제일로부터 7일 이내엔 100% 환불해드립니다. 그 이후엔 사용한 기간만큼 차감한 prorated 환불이 적용됩니다.",
  },
  {
    q: "여러 매장을 운영하면 어떻게 하나요?",
    a: "2~3개 매장이라면 각각 Pro로 개별 가입을 추천드립니다. 4개 이상부터는 Enterprise 문의 시 다매장 할인을 적용해드립니다.",
  },
  {
    q: "결제는 어떻게 이뤄지나요?",
    a: "국내 신용카드, 계좌이체, 세금계산서 발행 모두 지원합니다. 매월 자동 결제 또는 연간 일시불 (10% 할인) 선택 가능합니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="Hesya — 홈으로">
            Hesya<span className="brand-pill">·KR</span>
          </Link>
          <nav className="top-links" aria-label="주 메뉴">
            <Link href="/">제품</Link>
            <Link href="/pricing" aria-current="page">
              요금제
            </Link>
            <Link href="/trending">Trending</Link>
            <a href="#">고객 사례</a>
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
              PRICING
            </div>
            <h1 id="hero-h">
              <span className="ko" lang="ko">
                외국인 손님 응대를
              </span>
              <span className="ko" lang="ko">
                자동으로
              </span>
            </h1>
            <p className="sub" lang="ko">
              베타 매장은 6개월간 무료. 그 다음엔 ₩49,000부터. 사장님이 가장 잘
              하시는 일에 집중하세요.
            </p>
            <div className="trust-strip">
              <span>
                <span className="num">5</span>
                <span lang="ko">베타 매장</span>
              </span>
              <span>
                <span className="num">95%</span>
                <span lang="ko">응답률</span>
              </span>
              <span>
                <span className="num">3분</span>
                <span lang="ko">평균 응답 시간</span>
              </span>
            </div>
          </div>
        </section>

        {/* §2 Tier Cards */}
        <section className="tiers" aria-labelledby="tiers-h">
          <h2
            id="tiers-h"
            className="mono"
            style={{ position: "absolute", left: "-9999px" }}
          >
            요금제
          </h2>
          <div className="tiers-wrap">
            <div className="tier-grid">
              <article className="tier" aria-labelledby="t1-h">
                <h3 className="tier-name" id="t1-h">
                  Free
                </h3>
                <p className="tier-sub" lang="ko">
                  베타 매장 한정 · 6개월
                </p>
                <div className="tier-price">
                  <span className="mono">₩0</span>
                </div>
                <p className="tier-price-sub" lang="ko">
                  /월
                </p>
                <ul className="tier-features">
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      외국인 메시지 <span className="mono">100건</span>/월
                    </span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      채널 <span className="mono">1개</span> (WhatsApp 또는
                      Instagram)
                    </span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">AI 자동 응답</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      <span className="mono">5개</span> 언어 지원
                    </span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">이메일 지원</span>
                  </li>
                </ul>
                <Link
                  href="/onboarding/kyc"
                  className="tier-cta ghost"
                  aria-label="Free 플랜 베타 신청"
                >
                  베타 신청 →
                </Link>
              </article>

              <article className="tier pro" aria-labelledby="t2-h">
                <span
                  className="tier-recommended"
                  aria-label="Recommended plan"
                >
                  RECOMMENDED
                </span>
                <h3 className="tier-name" id="t2-h">
                  Pro
                </h3>
                <p className="tier-sub amber" lang="ko">
                  가장 많이 선택하시는 플랜
                </p>
                <div className="tier-price">
                  <span className="mono">₩49,000</span>
                </div>
                <p className="tier-price-sub" lang="ko">
                  /월 · 부가세 별도
                </p>
                <ul className="tier-features">
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">무제한 외국인 메시지</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      <span className="mono">4개</span> 채널 (WhatsApp /
                      Instagram / 카카오 / Naver)
                    </span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">AI 학습 (매장 톤 반영)</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">매장 대시보드 + 분석</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">결제 통합 (Stripe / Alipay / WeChat)</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">우선 응답 SLA</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      채팅 지원 (<span className="mono">3분</span> 응답)
                    </span>
                  </li>
                </ul>
                <Link
                  href="/onboarding/kyc"
                  className="tier-cta primary"
                  aria-label="Pro 플랜 14일 무료 시작"
                >
                  Pro 14일 무료 시작
                </Link>
                <p className="tier-cta-foot" lang="ko">
                  신용카드 불필요 · 언제든 취소
                </p>
              </article>

              <article className="tier" aria-labelledby="t3-h">
                <h3 className="tier-name" id="t3-h">
                  Enterprise
                </h3>
                <p className="tier-sub" lang="ko">
                  다매장 · 프랜차이즈
                </p>
                <div className="tier-price enterprise" lang="ko">
                  문의
                </div>
                <p className="tier-price-sub" lang="ko">
                  맞춤 견적
                </p>
                <ul className="tier-features">
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">모든 Pro 기능</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">다매장 통합 관리</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">Custom 통합 (POS / CRM)</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">
                      <span className="mono">99.9%</span> SLA
                    </span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">전담 매니저</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">사용량 무제한</span>
                  </li>
                  <li>
                    {CHECK_ICON}
                    <span lang="ko">API 액세스</span>
                  </li>
                </ul>
                <a
                  href="mailto:sales@hesya.app"
                  className="tier-cta ghost"
                  aria-label="Enterprise 영업팀 연락"
                >
                  영업팀 연락 →
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* §3 Comparison */}
        <section className="compare" aria-labelledby="compare-h">
          <div className="compare-wrap">
            <h2 className="section-h" id="compare-h">
              <span className="ko" lang="ko">
                전체 기능 비교
              </span>
            </h2>

            <table className="compare-table">
              <caption
                className="mono"
                style={{ position: "absolute", left: "-9999px" }}
              >
                Hesya 요금제별 전체 기능 비교
              </caption>
              <thead>
                <tr>
                  <th scope="col">기능</th>
                  <th scope="col">Free</th>
                  <th scope="col" className="pro-col">
                    Pro
                  </th>
                  <th scope="col">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="grp">
                  <td colSpan={4} lang="ko">
                    응답 자동화
                  </td>
                </tr>
                <tr>
                  <td lang="ko">영업시간 외 자동 응답</td>
                  <td className="check">{CHECK_ICON}</td>
                  <td className="pro-col check">{CHECK_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>
                <tr>
                  <td lang="ko">AI 톤 학습</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col check">{CHECK_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>
                <tr>
                  <td lang="ko">메시지 수</td>
                  <td>
                    <span className="mono">100건/월</span>
                  </td>
                  <td className="pro-col">
                    <span className="mono">무제한</span>
                  </td>
                  <td>
                    <span className="mono">무제한</span>
                  </td>
                </tr>

                <tr className="grp">
                  <td colSpan={4} lang="ko">
                    다국어 + 결제
                  </td>
                </tr>
                <tr>
                  <td lang="ko">다국어 (5개)</td>
                  <td className="check">{CHECK_ICON}</td>
                  <td className="pro-col check">{CHECK_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>
                <tr>
                  <td lang="ko">채널 수</td>
                  <td>
                    <span className="mono">1개</span>
                  </td>
                  <td className="pro-col">
                    <span className="mono">4개</span>
                  </td>
                  <td>
                    <span className="mono">무제한</span>
                  </td>
                </tr>
                <tr>
                  <td lang="ko">결제 통합 (Stripe / Alipay / WeChat)</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col check">{CHECK_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>

                <tr className="grp">
                  <td colSpan={4} lang="ko">
                    매장 운영 도구
                  </td>
                </tr>
                <tr>
                  <td lang="ko">매장 대시보드</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col check">{CHECK_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>
                <tr>
                  <td lang="ko">다매장 통합</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col miss">{MISS_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>

                <tr className="grp">
                  <td colSpan={4} lang="ko">
                    분석 + API
                  </td>
                </tr>
                <tr>
                  <td lang="ko">API 액세스</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col miss">{MISS_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>

                <tr className="grp">
                  <td colSpan={4} lang="ko">
                    지원
                  </td>
                </tr>
                <tr>
                  <td lang="ko">SLA</td>
                  <td lang="ko">이메일</td>
                  <td className="pro-col">
                    <span className="mono">3분</span>
                  </td>
                  <td>
                    <span className="mono">99.9%</span>
                  </td>
                </tr>
                <tr>
                  <td lang="ko">전담 매니저</td>
                  <td className="miss">{MISS_ICON}</td>
                  <td className="pro-col miss">{MISS_ICON}</td>
                  <td className="check">{CHECK_ICON}</td>
                </tr>
              </tbody>
            </table>

            <PricingMobileCompare />
          </div>
        </section>

        {/* §4 FAQ */}
        <section className="faq-section" aria-labelledby="faq-h">
          <div className="faq-wrap">
            <h2 className="section-h" id="faq-h">
              <span className="ko" lang="ko">
                자주 묻는 질문
              </span>
            </h2>
            <PricingFaq items={FAQ_ITEMS} />
          </div>
        </section>

        {/* §5 Trust + Final CTA */}
        <section className="trust-final" aria-labelledby="trust-h">
          <div className="trust-final-wrap">
            <div className="eyebrow" aria-hidden="true">
              WHY HESYA
            </div>
            <h2 id="trust-h">
              <span className="ko" lang="ko">
                외국인 손님 응대, 더 이상 부담이 아니에요.
              </span>
            </h2>
            <div className="trust-mini">
              <div className="item">
                <div className="num">5</div>
                <div className="cap" lang="ko">
                  베타 매장 · 평균 매출 30% 증가
                </div>
              </div>
              <div className="item">
                <div className="num">95%</div>
                <div className="cap" lang="ko">
                  응답률 · AI + 사장님 함께
                </div>
              </div>
              <div className="item">
                <div className="num">3분</div>
                <div className="cap" lang="ko">
                  평균 응답 시간
                </div>
              </div>
            </div>
            <div className="final-cta-row">
              <Link href="/onboarding/kyc" className="btn primary">
                Pro 14일 무료 시작
              </Link>
              <a href="mailto:sales@hesya.app" className="btn ghost" lang="ko">
                데모 보기 (15분)
              </a>
            </div>
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
