import { useTranslations } from "next-intl";

export function MarketingFinalCta() {
  const t = useTranslations("MarketingLanding");
  return (
    <section
      id="cta-traveler"
      aria-labelledby="final-h2"
      className="mk-section"
    >
      <div className="mk-wrap">
        <h2 id="final-h2">{t("finalCtaTitle")}</h2>
        <div>
          <h3>{t("finalCtaTraveler")}</h3>
          <p>{t("finalCtaTravelerBody")}</p>
          <p>
            <a href="#">{t("finalCtaTravelerBtn")}</a>
          </p>
          <p>
            <small>
              {t("finalCtaTravelerBadgeIos")} ·{" "}
              {t("finalCtaTravelerBadgeAndroid")}
            </small>
          </p>
        </div>
        <div>
          <h3>{t("finalCtaOwner")}</h3>
          <p>{t("finalCtaOwnerBody")}</p>
          <p>
            <a href="#">{t("finalCtaOwnerBtn")}</a>{" "}
            <a href="#">{t("finalCtaOwnerDash")}</a>
          </p>
        </div>
        <div>
          <h3>{t("finalCtaPartner")}</h3>
          <p>
            <a href="#">{t("finalCtaPartnerLogin")}</a>{" "}
            <a href="#">{t("finalCtaPartnerDashboard")}</a>
          </p>
        </div>
        <p>
          <small>{t("finalCtaTrust")}</small>
        </p>
      </div>
    </section>
  );
}
