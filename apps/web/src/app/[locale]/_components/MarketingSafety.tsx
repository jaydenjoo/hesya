import { useTranslations } from "next-intl";

type SafetyCard = { icon: string; title: string; body: string };

export function MarketingSafety() {
  const t = useTranslations("MarketingLanding");
  const cards = t.raw("safetyCards") as SafetyCard[];
  return (
    <section id="safety" aria-labelledby="safety-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("safetyEyebrow")}</span>
        <h2 id="safety-h2">{t("safetyTitle")}</h2>
        <p>{t("safetyBody")}</p>
        <p>
          <small>{t("safetyCite")}</small>
        </p>
        <ul>
          {cards.map((c) => (
            <li key={c.title}>
              <span aria-hidden="true">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
