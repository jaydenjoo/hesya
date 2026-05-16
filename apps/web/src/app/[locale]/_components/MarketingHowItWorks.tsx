import { useTranslations } from "next-intl";

export function MarketingHowItWorks() {
  const t = useTranslations("MarketingLanding");
  const steps = [
    { title: t("howStep1Title"), body: t("howStep1Body") },
    { title: t("howStep2Title"), body: t("howStep2Body") },
    { title: t("howStep3Title"), body: t("howStep3Body") },
    { title: t("howStep4Title"), body: t("howStep4Body") },
  ];

  return (
    <section
      aria-labelledby="how-h2"
      className="bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-600">
          {t("howEyebrow")}
        </p>
        <h2
          id="how-h2"
          className="max-w-3xl font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
        >
          {t("howTitle")}
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.3fr_0.7fr]">
          <ol className="space-y-12">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-6">
                <span
                  aria-hidden="true"
                  className="shrink-0 font-heading text-5xl tabular-nums text-hesya-amber-500"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-heading text-2xl leading-tight text-hesya-navy-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-hesya-navy-900/70">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="hidden md:block">
            <div
              role="img"
              aria-label="Mobile app preview — Show us a look"
              className="sticky top-24 mx-auto flex aspect-[9/19] w-full max-w-[280px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[2.5rem] border-8 border-hesya-navy-900 bg-hesya-peach-100 p-6 text-hesya-navy-900 shadow-2xl"
            >
              <span aria-hidden="true" className="text-5xl">
                📸
              </span>
              <p className="text-center font-heading text-lg">Show us a look</p>
              <p
                lang="ko"
                className="rounded-full bg-white px-4 py-2 text-sm shadow-md"
              >
                &ldquo;송혜교 단발이요&rdquo;
              </p>
              <p className="rounded-full bg-white px-4 py-2 text-sm shadow-md">
                &ldquo;Glass-skin makeup, please&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
