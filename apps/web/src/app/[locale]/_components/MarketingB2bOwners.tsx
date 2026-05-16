import { useTranslations } from "next-intl";

type MockTile = { label: string; value: string };

export function MarketingB2bOwners() {
  const t = useTranslations("MarketingLanding");
  const bullets = t.raw("b2bBullets") as string[];
  const tiles = t.raw("b2bMockTiles") as MockTile[];

  return (
    <section
      id="salons"
      aria-labelledby="b2b-h2"
      className="bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-600">
            {t("b2bEyebrow")}
          </p>
          <h2
            id="b2b-h2"
            className="font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
          >
            {t("b2bTitle")}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-hesya-navy-900/80">
            {t("b2bBody")}
          </p>
          <ul role="list" className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-sm text-hesya-navy-900/80"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-hesya-amber-600"
                >
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#"
              className="rounded-full bg-hesya-navy-900 px-6 py-3 text-base text-hesya-peach-50 transition hover:bg-hesya-navy-900/90"
            >
              {t("b2bCtaPrimary")}
            </a>
            <a
              href="#"
              className="text-sm text-hesya-amber-600 underline-offset-4 hover:underline"
            >
              {t("b2bCtaSecondary")}
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl">
          <header className="mb-6 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-hesya-amber-500 font-heading text-lg text-white"
            >
              S
            </span>
            <div>
              <p className="font-heading text-sm text-hesya-navy-900">
                {t("b2bMockHead")}
              </p>
              <p className="text-xs text-hesya-navy-900/60">
                {t("b2bMockSubhead")}
              </p>
            </div>
          </header>
          <ul role="list" className="grid grid-cols-2 gap-3">
            {tiles.map((tile) => (
              <li
                key={tile.label}
                className="rounded-2xl bg-hesya-peach-50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.1em] text-hesya-navy-900/60">
                  {tile.label}
                </p>
                <p className="mt-2 font-heading text-2xl tabular-nums text-hesya-navy-900">
                  {tile.value}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-hesya-amber-500/10 px-4 py-2 text-center text-sm font-medium text-hesya-amber-600">
            {t("b2bMockOverlay")}
          </p>
        </div>
      </div>
    </section>
  );
}
