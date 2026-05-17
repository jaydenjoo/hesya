import Image from "next/image";
import { useTranslations } from "next-intl";

import { MarketingEyebrow } from "./MarketingEyebrow";
import { MarketingSectionNum } from "./MarketingSectionNum";

type SalonCard = {
  name: string;
  location: string;
  rating: string;
  reviews: string;
  verified: boolean;
};

const SALON_IMAGES = [
  "/assets/images/salon-01-stylista.webp",
  "/assets/images/salon-02-yuri.webp",
  "/assets/images/salon-03-mirror-glass.webp",
  "/assets/images/salon-04-nail-atelier.webp",
  "/assets/images/salon-05-color-lab.webp",
  "/assets/images/salon-06-soohair.webp",
] as const;

const FALLBACK_IMAGE = "/assets/images/hero-poster.webp";

export function MarketingSalonsGrid() {
  const t = useTranslations("MarketingLanding");
  const salons = t.raw("salonList") as SalonCard[];

  return (
    <section
      aria-labelledby="salons-h2"
      className="relative bg-white px-6 py-20 md:py-32"
    >
      <MarketingSectionNum value="05" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <MarketingEyebrow>{t("salonsEyebrow")}</MarketingEyebrow>
            <h2
              id="salons-h2"
              className="max-w-2xl font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
            >
              {t("salonsTitle")}
            </h2>
          </div>
          <a
            href="#"
            className="text-sm text-hesya-amber-700 underline-offset-4 hover:underline"
          >
            {t("salonsMore")}
          </a>
        </div>

        <ul
          role="list"
          className="-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:p-0"
        >
          {salons.map((s, i) => (
            <li
              key={s.name}
              className="w-[296px] shrink-0 snap-start xl:w-auto"
            >
              <a
                href="#"
                className="group block overflow-hidden rounded-3xl bg-hesya-peach-50 transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={SALON_IMAGES[i] ?? FALLBACK_IMAGE}
                    alt={s.name}
                    width={800}
                    height={1000}
                    loading="lazy"
                    sizes="(min-width: 1280px) 25vw, 296px"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  {s.verified ? (
                    <span className="absolute right-4 top-4 rounded-full bg-hesya-navy-900/90 px-3 py-1 text-xs uppercase tracking-[0.12em] text-kverified-gold">
                      ★ K-Verified
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <p className="font-heading text-lg text-hesya-navy-900">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-hesya-navy-700">
                    {s.location}
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="text-hesya-amber-700">{s.rating}</span>{" "}
                    <span className="text-hesya-navy-700">· {s.reviews}</span>
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
