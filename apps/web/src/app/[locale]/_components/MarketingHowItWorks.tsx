import { useTranslations } from "next-intl";

export function MarketingHowItWorks() {
  const t = useTranslations("MarketingLanding");
  return (
    <section aria-labelledby="how-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("howEyebrow")}</span>
        <h2 id="how-h2">{t("howTitle")}</h2>
        <ol>
          <li>
            <h3>{t("howStep1Title")}</h3>
            <p>{t("howStep1Body")}</p>
          </li>
          <li>
            <h3>{t("howStep2Title")}</h3>
            <p>{t("howStep2Body")}</p>
          </li>
          <li>
            <h3>{t("howStep3Title")}</h3>
            <p>{t("howStep3Body")}</p>
          </li>
          <li>
            <h3>{t("howStep4Title")}</h3>
            <p>{t("howStep4Body")}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
