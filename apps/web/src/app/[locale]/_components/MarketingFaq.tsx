import { useTranslations } from "next-intl";

import { MarketingEyebrow } from "./MarketingEyebrow";
import { MarketingSectionNum } from "./MarketingSectionNum";

type FaqItem = { q: string; a: string };

export function MarketingFaq() {
  const t = useTranslations("MarketingLanding");
  const items = t.raw("faqItems") as FaqItem[];

  return (
    <section
      id="about"
      aria-labelledby="faq-h2"
      className="relative bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <MarketingSectionNum value="10" />
      <div className="relative mx-auto max-w-[720px]">
        <div className="text-center">
          <MarketingEyebrow centered>{t("faqEyebrow")}</MarketingEyebrow>
          <h2
            id="faq-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
          >
            {t.rich("faqTitle", {
              em: (chunks) => (
                <em className="text-hesya-amber-700">{chunks}</em>
              ),
            })}
          </h2>
        </div>

        <div className="mt-10 divide-y divide-hesya-peach-200">
          {items.map((item) => (
            <details key={item.q} className="group py-5 [&>summary]:list-none">
              <summary className="flex cursor-pointer items-start gap-4 pr-6 text-[17px] font-semibold text-hesya-navy-900">
                <span className="flex-1">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 font-heading text-2xl italic text-hesya-amber-700 group-open:hidden"
                >
                  +
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 font-heading text-2xl italic text-hesya-amber-700 group-open:inline"
                >
                  −
                </span>
              </summary>
              <p className="mt-3.5 pr-6 text-[15px] leading-[1.65] text-hesya-navy-900/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
