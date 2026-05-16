import { useTranslations } from "next-intl";

export function MarketingBeforeAfter() {
  const t = useTranslations("MarketingLanding");
  return (
    <section id="reviews" aria-labelledby="ba-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("baEyebrow")}</span>
        <h2 id="ba-h2">{t("baTitle")}</h2>
        <p>{t("baSub")}</p>
        <p>{t("baCaption")}</p>
      </div>
    </section>
  );
}
