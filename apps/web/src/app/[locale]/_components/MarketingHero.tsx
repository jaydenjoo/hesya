import { useTranslations } from "next-intl";

export function MarketingHero() {
  const t = useTranslations("MarketingLanding");
  return (
    <section id="travelers" aria-labelledby="hero-h1" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">
          {t("heroEyebrowEn")} · <span lang="ko">{t("heroEyebrowKr")}</span>
        </span>
        <h1 id="hero-h1">{t("heroSub")}</h1>
        <p>
          <a href="#cta-traveler">{t("heroCtaPrimary")}</a>{" "}
          <a href="#salons">{t("heroCtaSecondary")}</a>
        </p>
      </div>
    </section>
  );
}
