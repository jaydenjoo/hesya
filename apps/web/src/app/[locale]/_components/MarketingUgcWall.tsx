import { useTranslations } from "next-intl";

type UgcReview = {
  flag: string;
  nick: string;
  stars: string;
  quote: string;
  trans: string;
  src: string;
};

const PHOTO_GRADIENTS: Record<number, string> = {
  0: "linear-gradient(135deg, #F5DDC8, #E8A97A)",
  3: "linear-gradient(135deg, #F8E9D9, #D88B5B)",
  5: "linear-gradient(135deg, #E8C4D6, #C97550)",
};

const COLUMN_INDICES: number[][] = [
  [0, 1],
  [2, 3, 4],
  [5, 6],
];

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
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-700">
            {t("ugcEyebrow")}
          </p>
          <h2
            id="ugc-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl"
          >
            {t("ugcTitle")}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMN_INDICES.map((col, ci) => (
            <ul key={`col-${ci}`} role="list" className="flex flex-col gap-5">
              {col
                .filter((idx) => idx < reviews.length)
                .map((idx) => {
                  const r = reviews[idx]!;
                  const photo = PHOTO_GRADIENTS[idx];
                  const isXhs = r.src.toLowerCase().includes("xiaohongshu");
                  return (
                    <li key={`${r.nick}-${r.src}`}>
                      <article className="relative rounded-2xl bg-white p-6 shadow-sm">
                        <span
                          className={`absolute right-5 top-5 text-[10.5px] font-bold uppercase tracking-[0.04em] ${
                            isXhs ? "text-[#FE2C55]" : "text-[#C13584]"
                          }`}
                        >
                          {isXhs ? "红 " : "◉ "}
                          {r.src}
                        </span>
                        {photo ? (
                          <div
                            aria-hidden="true"
                            className="mb-3 aspect-square w-full rounded-xl"
                            style={{ background: photo }}
                          />
                        ) : null}
                        <header className="flex items-center gap-2 pr-24">
                          <span aria-hidden="true" className="text-xl">
                            {r.flag}
                          </span>
                          <span className="font-heading text-sm text-hesya-navy-900">
                            {r.nick}
                          </span>
                          <span
                            aria-label={`${r.stars} rating`}
                            className="ml-auto text-xs tracking-[1px] text-hesya-amber-500"
                          >
                            {r.stars}
                          </span>
                        </header>
                        <p
                          lang="ko"
                          className="mt-3 text-[15px] leading-[1.65] text-hesya-navy-900"
                        >
                          &ldquo;{r.quote}&rdquo;
                        </p>
                        <p className="mt-2 font-heading text-[13px] italic leading-[1.55] text-hesya-navy-900/60">
                          {r.trans}
                        </p>
                      </article>
                    </li>
                  );
                })}
            </ul>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#"
            className="text-sm font-semibold text-hesya-amber-700 underline-offset-4 hover:underline"
          >
            {t("ugcMore")}
          </a>
        </div>
      </div>
    </section>
  );
}
