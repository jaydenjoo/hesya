import { useTranslations } from "next-intl";

type SalonCard = {
  name: string;
  location: string;
  rating: string;
  reviews: string;
  verified: boolean;
};

export function MarketingSalonsGrid() {
  const t = useTranslations("MarketingLanding");
  const salons = t.raw("salonList") as SalonCard[];
  return (
    <section aria-labelledby="salons-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("salonsEyebrow")}</span>
        <h2 id="salons-h2">{t("salonsTitle")}</h2>
        <ul>
          {salons.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong> {s.location} {s.rating}{" "}
              <small>{s.reviews}</small>
              {s.verified ? " · ★ K-Verified" : null}
            </li>
          ))}
        </ul>
        <p>
          <a href="#">{t("salonsMore")}</a>
        </p>
      </div>
    </section>
  );
}
