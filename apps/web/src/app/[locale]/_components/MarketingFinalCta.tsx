import { useTranslations } from "next-intl";

export function MarketingFinalCta() {
  const t = useTranslations("MarketingLanding");

  return (
    <section
      id="cta-traveler"
      aria-labelledby="final-h2"
      className="bg-hesya-navy-900 px-6 py-20 text-hesya-peach-50 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="final-h2"
          className="text-center font-heading text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {t("finalCtaTitle")}
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1fr_0.7fr] md:items-start">
          <article className="rounded-3xl bg-hesya-peach-50/10 p-8 backdrop-blur">
            <p aria-hidden="true" className="text-3xl">
              🌸
            </p>
            <h3 className="mt-4 font-heading text-2xl">
              {t("finalCtaTraveler")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-hesya-peach-50/80">
              {t("finalCtaTravelerBody")}
            </p>
            <a
              href="#"
              className="mt-6 inline-block rounded-full bg-hesya-amber-500 px-6 py-3 text-base text-hesya-navy-900 transition hover:bg-hesya-amber-600"
            >
              {t("finalCtaTravelerBtn")}
            </a>
            <p className="mt-4 flex flex-wrap gap-2 text-xs text-hesya-peach-50/60">
              <span>{t("finalCtaTravelerBadgeIos")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("finalCtaTravelerBadgeAndroid")}</span>
            </p>
          </article>

          <article className="rounded-3xl bg-hesya-peach-50/10 p-8 backdrop-blur">
            <p aria-hidden="true" className="text-3xl">
              ✂️
            </p>
            <h3 className="mt-4 font-heading text-2xl">{t("finalCtaOwner")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-hesya-peach-50/80">
              {t("finalCtaOwnerBody")}
            </p>
            <a
              href="#"
              className="mt-6 inline-block rounded-full border border-hesya-peach-50/40 px-6 py-3 text-base text-hesya-peach-50 transition hover:bg-hesya-peach-50/10"
            >
              {t("finalCtaOwnerBtn")}
            </a>
            <p className="mt-4">
              <a
                href="#"
                className="text-xs text-hesya-amber-500 underline-offset-4 hover:underline"
              >
                {t("finalCtaOwnerDash")}
              </a>
            </p>
          </article>

          <article className="rounded-3xl border border-dashed border-hesya-peach-50/20 bg-transparent p-8">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-hesya-peach-200">
              {t("finalCtaPartner")}
            </h3>
            <a
              href="#"
              className="mt-4 block border-b border-hesya-peach-50/10 py-2.5 text-sm text-hesya-peach-50 transition hover:text-hesya-amber-500"
            >
              {t("finalCtaPartnerLogin")}
            </a>
            <a
              href="#"
              className="block py-2.5 text-sm text-hesya-peach-50 transition hover:text-hesya-amber-500"
            >
              {t("finalCtaPartnerDashboard")}
            </a>
          </article>
        </div>

        <p className="mt-16 border-t border-hesya-peach-50/15 pt-8 text-center text-[11.5px] uppercase tracking-[0.04em] text-hesya-peach-200">
          {t("finalCtaTrust")}
        </p>
      </div>
    </section>
  );
}
