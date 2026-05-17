import { useTranslations } from "next-intl";

export function MarketingTrending() {
  const t = useTranslations("MarketingLanding");
  const chips = t.raw("trendingChips") as string[];

  return (
    <section
      aria-labelledby="trending-h2"
      className="bg-hesya-peach-100/40 px-6 py-20 md:py-32"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-700">
          {t("trendingEyebrow")}
        </p>
        <h2
          id="trending-h2"
          className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
        >
          {t("trendingTitle")}
        </h2>
        <p className="mt-4 text-base text-hesya-navy-900/70">
          {t("trendingSub")}
        </p>

        <ul role="list" className="mt-10 flex flex-wrap justify-center gap-3">
          {chips.map((chip, i) => (
            <li key={chip}>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 rounded-full border border-hesya-peach-200 bg-white px-4 py-2.5 text-[13.5px] text-hesya-navy-900 transition hover:border-hesya-amber-500 hover:shadow-[0_6px_20px_var(--color-share-glow)]"
              >
                <span
                  aria-hidden="true"
                  className="font-heading italic font-semibold text-hesya-amber-700"
                >
                  #{i + 1}
                </span>
                <span>{chip}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
