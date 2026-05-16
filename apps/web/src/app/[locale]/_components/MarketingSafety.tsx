import { useTranslations } from "next-intl";

type SafetyCard = { icon: string; title: string; body: string };

export function MarketingSafety() {
  const t = useTranslations("MarketingLanding");
  const cards = t.raw("safetyCards") as SafetyCard[];

  return (
    <section
      id="safety"
      aria-labelledby="safety-h2"
      className="bg-trust-rose/30 px-6 py-20 md:py-32"
    >
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-600">
            {t("safetyEyebrow")}
          </p>
          <h2
            id="safety-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
          >
            {t("safetyTitle")}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-hesya-navy-900/80">
            {t("safetyBody")}
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.12em] text-hesya-navy-900/50">
            {t("safetyCite")}
          </p>
        </div>

        <ul role="list" className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li
              key={c.title}
              className="rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <span aria-hidden="true" className="text-3xl">
                {c.icon}
              </span>
              <h3 className="mt-3 font-heading text-xl text-hesya-navy-900">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-hesya-navy-900/70">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
