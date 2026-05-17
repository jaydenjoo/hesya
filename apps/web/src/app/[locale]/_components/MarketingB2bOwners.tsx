import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

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
          <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-700">
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
                  className="mt-0.5 text-hesya-amber-700"
                >
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/onboarding/kyc"
              className="rounded-full bg-hesya-navy-900 px-6 py-3 text-base text-hesya-peach-50 transition hover:bg-hesya-navy-900/90"
            >
              {t("b2bCtaPrimary")}
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-hesya-amber-700 underline-offset-4 hover:underline"
            >
              {t("b2bCtaSecondary")}
            </Link>
          </div>
        </div>

        <div className="relative rounded-2xl border border-hesya-peach-100 bg-white p-5 shadow-xl">
          <header className="mb-4 flex items-center gap-3 border-b border-hesya-peach-100 pb-4">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-hesya-amber-500 to-hesya-amber-600 font-heading text-lg italic font-bold text-white"
            >
              S
            </span>
            <div>
              <p className="font-heading text-[13.5px] font-bold text-hesya-navy-900">
                {t("b2bMockHead")}
              </p>
              <p className="text-[11px] text-hesya-navy-700">
                {t("b2bMockSubhead")}
              </p>
            </div>
          </header>
          <ul role="list" className="grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
              <li
                key={tile.label}
                className="rounded-xl bg-hesya-peach-50 p-3.5"
              >
                <p className="text-[11px] uppercase tracking-[0.04em] text-hesya-navy-700">
                  {tile.label}
                </p>
                <p className="mt-1 font-heading text-2xl italic tabular-nums text-hesya-navy-900">
                  {tile.value}
                </p>
              </li>
            ))}
          </ul>
          <p className="absolute -bottom-4 right-5 rounded-full bg-hesya-navy-900 px-3.5 py-2.5 font-mono text-xs font-bold text-hesya-peach-50 shadow-xl">
            {t("b2bMockOverlay")}
          </p>
        </div>
      </div>
    </section>
  );
}
