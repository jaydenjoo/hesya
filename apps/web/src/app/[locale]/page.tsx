import { getTranslations } from "next-intl/server";
import { LandingFooter, LandingHero } from "@/features/landing";

/**
 * γ.2.3.5 — Hesya 공개 landing.
 *
 * 보일러플레이트(create-next-app) 제거. 다국어 인사 ticker + Hesya 가치 한 줄
 * + 사장님 로그인 CTA. Customer 검색 / 매장 카드 / 트렌딩 / 리뷰는 베타 매장
 * 매칭 phase ζ에서 실 데이터와 결합 후 도입.
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });

  return (
    <div className="flex min-h-screen flex-col bg-hesya-peach-50/40">
      <main className="flex-1">
        <LandingHero
          locale={locale}
          subCopy={t("subCopy")}
          ctaLabel={t("ownerCta")}
          customerNote={t("customerNote")}
        />
      </main>
      <LandingFooter locale={locale} hint={t("footerHint")} />
    </div>
  );
}
