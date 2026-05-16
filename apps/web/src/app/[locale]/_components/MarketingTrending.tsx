import { useTranslations } from "next-intl";

export function MarketingTrending() {
  const t = useTranslations("MarketingLanding");
  const chips = t.raw("trendingChips") as string[];
  return (
    <section aria-labelledby="trending-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("trendingEyebrow")}</span>
        <h2 id="trending-h2">{t("trendingTitle")}</h2>
        <p>{t("trendingSub")}</p>
        <ul>
          {chips.map((chip, i) => (
            <li key={chip}>
              <a href="#">
                <span aria-hidden="true">#{i + 1}</span> {chip}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
