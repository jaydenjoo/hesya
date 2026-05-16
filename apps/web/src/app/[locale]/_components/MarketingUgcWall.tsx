import { useTranslations } from "next-intl";

type UgcReview = {
  flag: string;
  nick: string;
  stars: string;
  quote: string;
  trans: string;
  src: string;
};

export function MarketingUgcWall() {
  const t = useTranslations("MarketingLanding");
  const reviews = t.raw("ugcReviews") as UgcReview[];
  return (
    <section aria-labelledby="ugc-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("ugcEyebrow")}</span>
        <h2 id="ugc-h2">{t("ugcTitle")}</h2>
        <ul>
          {reviews.map((r) => (
            <li key={`${r.nick}-${r.src}`}>
              <span aria-hidden="true">{r.flag}</span> <strong>{r.nick}</strong>{" "}
              <span>{r.stars}</span>
              <p lang="ko">{r.quote}</p>
              <p>{r.trans}</p>
              <small>{r.src}</small>
            </li>
          ))}
        </ul>
        <p>
          <a href="#">{t("ugcMore")}</a>
        </p>
      </div>
    </section>
  );
}
