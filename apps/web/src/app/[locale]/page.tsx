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
  MarketingSafety,
  MarketingSalonsGrid,
  MarketingTrending,
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
      <main id="main">
        <MarketingHero />
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
