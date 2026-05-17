import { useTranslations } from "next-intl";

type SafetyCard = { icon: string; title: string; body: string };

export function MarketingSafety() {
  const t = useTranslations("MarketingLanding");
  const cards = t.raw("safetyCards") as SafetyCard[];

  return (
    <section
      id="safety"
      aria-labelledby="safety-h2"
      className="relative bg-hesya-peach-200 px-6 py-20 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 md:grid-cols-[2fr_3fr] md:gap-16">
          <div>
            <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-700">
              {t("safetyEyebrow")}
            </p>
            <h2
              id="safety-h2"
              className="font-heading text-4xl leading-[1.1] tracking-tight text-hesya-navy-900 md:text-5xl"
            >
              {t("safetyTitle")}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-hesya-navy-900/80 md:text-[17px]">
              {t("safetyBody")}
            </p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.04em] text-hesya-navy-900/50">
              {t("safetyCite")}
            </p>
          </div>

          <ul role="list" className="grid gap-4 sm:grid-cols-2">
            {cards.map((c) => (
              <li
                key={c.title}
                className="rounded-2xl bg-hesya-peach-50 p-6 shadow-sm"
              >
                <span aria-hidden="true" className="block text-[26px]">
                  {c.icon}
                </span>
                <h3 className="mt-3 font-heading text-lg text-hesya-navy-900">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.55] text-hesya-navy-900/70">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden="true" className="mt-16 h-px bg-trust-rose" />
      </div>
    </section>
  );
}
