import { type Locale } from "@hesya/translations";
import { setRequestLocale } from "next-intl/server";

import {
  MarketingB2bOwners,
  MarketingBeforeAfter,
  MarketingFaq,
  MarketingFinalCta,
  MarketingFooter,
  MarketingHero,
  MarketingHowItWorks,
  MarketingNav,
  MarketingSafety,
  MarketingSalonsGrid,
  MarketingTrending,
  MarketingTrustBar,
  MarketingUgcWall,
} from "./_components";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <MarketingNav />
      <main id="main">
        <MarketingHero />
        <MarketingTrustBar />
        <MarketingHowItWorks />
        <MarketingBeforeAfter />
        <MarketingSalonsGrid />
        <MarketingUgcWall />
        <MarketingSafety />
        <MarketingB2bOwners />
        <MarketingTrending />
        <MarketingFaq />
        <MarketingFinalCta />
      </main>
      <MarketingFooter />
    </>
  );
}
