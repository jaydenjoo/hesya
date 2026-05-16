import { useTranslations } from "next-intl";

type FaqItem = { q: string; a: string };

export function MarketingFaq() {
  const t = useTranslations("MarketingLanding");
  const items = t.raw("faqItems") as FaqItem[];

  return (
    <section
      id="about"
      aria-labelledby="faq-h2"
      className="bg-white px-6 py-20 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-600">
            {t("faqEyebrow")}
          </p>
          <h2
            id="faq-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
          >
            {t("faqTitle")}
          </h2>
        </div>

        <div className="mt-12 divide-y divide-hesya-navy-900/10 border-y border-hesya-navy-900/10">
          {items.map((item) => (
            <details key={item.q} className="group py-5 [&>summary]:list-none">
              <summary className="flex cursor-pointer items-start justify-between gap-6">
                <span className="font-heading text-lg text-hesya-navy-900">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 font-mono text-xl text-hesya-amber-600 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-hesya-navy-900/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
