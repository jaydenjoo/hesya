import Link from "next/link";
import { GreetingTicker } from "./greeting-ticker";

type Props = {
  locale: string;
  /** locale-aware sub copy (Hesya 가치 한 줄) */
  subCopy: string;
  /** CTA 라벨 */
  ctaLabel: string;
  /** 부 CTA: 고객 검색 안내 (Phase 1 미구현) */
  customerNote: string;
};

/**
 * γ.2.3.5 — Hesya 공개 landing hero.
 *
 * 보일러플레이트(create-next-app) 제거 → Hesya brand 정체성 노출.
 * 다국어 인사 ticker (en/ko/ja/zh/vi) + amber underline + 가치 한 줄 +
 * primary CTA (사장님 로그인). 고객용 검색은 Phase 1 미구현 — note만.
 *
 * Customer landing의 풍부 sections (검색 / 매장 카드 / 트렌딩 / 리뷰)은
 * 베타 매장 매칭 phase ζ에서 실 데이터와 결합 후 도입.
 */
export function LandingHero({
  locale,
  subCopy,
  ctaLabel,
  customerNote,
}: Props) {
  return (
    <section className="ix-landing-hero relative overflow-hidden px-5 pt-16 pb-10 sm:px-10 sm:pt-24 sm:pb-14">
      <div className="mx-auto max-w-2xl">
        <GreetingTicker />
        <p className="max-w-[30ch] text-[15px] leading-[22px] text-hesya-navy-900/75">
          {subCopy}
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex h-12 items-center justify-center rounded-md bg-hesya-amber-500 px-6 font-medium text-white transition-colors hover:bg-hesya-amber-600"
          >
            {ctaLabel}
          </Link>
          <span className="text-xs text-hesya-navy-900/55 sm:max-w-[24ch]">
            {customerNote}
          </span>
        </div>
      </div>
    </section>
  );
}
