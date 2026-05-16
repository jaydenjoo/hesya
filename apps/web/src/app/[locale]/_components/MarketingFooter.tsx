import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("MarketingLanding");
  return (
    <footer className="mk-footer">
      <div className="mk-wrap">
        <h3>{t("footerBrand")}</h3>
        <p>{t("footerTagline")}</p>
        <p>
          <button type="button">{t("footerLangSwitch")}</button>
        </p>
      </div>
    </footer>
  );
}
