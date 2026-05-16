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
    <section
      aria-labelledby="ugc-h2"
      className="bg-hesya-peach-100 px-6 py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-600">
            {t("ugcEyebrow")}
          </p>
          <h2
            id="ugc-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
          >
            {t("ugcTitle")}
          </h2>
        </div>

        <ul
          role="list"
          className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3"
        >
          {reviews.map((r) => (
            <li key={`${r.nick}-${r.src}`} className="mb-6 break-inside-avoid">
              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <header className="flex items-center justify-between">
                  <p className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-xl">
                      {r.flag}
                    </span>
                    <span className="font-heading text-base text-hesya-navy-900">
                      {r.nick}
                    </span>
                  </p>
                  <span
                    aria-label={`${r.stars} rating`}
                    className="text-sm text-hesya-amber-600"
                  >
                    {r.stars}
                  </span>
                </header>
                <p className="mt-4 font-heading text-xl italic leading-snug text-hesya-navy-900">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <p className="mt-3 text-sm leading-relaxed text-hesya-navy-900/70">
                  {r.trans}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-hesya-amber-600">
                  {r.src}
                </p>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <a
            href="#"
            className="text-sm text-hesya-amber-600 underline-offset-4 hover:underline"
          >
            {t("ugcMore")}
          </a>
        </div>
      </div>
    </section>
  );
}
