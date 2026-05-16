import { useTranslations } from "next-intl";

type FaqItem = { q: string; a: string };

export function MarketingFaq() {
  const t = useTranslations("MarketingLanding");
  const items = t.raw("faqItems") as FaqItem[];
  return (
    <section id="about" aria-labelledby="faq-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("faqEyebrow")}</span>
        <h2 id="faq-h2">{t("faqTitle")}</h2>
        <ul>
          {items.map((item) => (
            <li key={item.q}>
              <details>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
