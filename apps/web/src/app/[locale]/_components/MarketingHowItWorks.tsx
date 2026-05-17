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
      className="relative bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-8 top-10 z-0 hidden font-heading text-[96px] italic leading-[0.9] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_var(--color-hesya-amber-600)] md:text-[160px] lg:block"
      >
        03
      </span>
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-700">
          {t("howEyebrow")}
        </p>
        <h2
          id="how-h2"
          className="max-w-3xl font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
        >
          {t("howTitle")}
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.05fr_1fr]">
          <ol className="space-y-0">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="flex min-h-[60vh] flex-col justify-center py-12 md:min-h-[80vh] md:py-16"
              >
                <span
                  aria-hidden="true"
                  className={`font-heading text-[120px] italic leading-[0.9] tracking-[-0.04em] md:text-[200px] ${
                    i === 0
                      ? "text-hesya-peach-100 [-webkit-text-stroke:1.5px_var(--color-hesya-amber-500)]"
                      : "text-transparent [-webkit-text-stroke:1.5px_var(--color-hesya-amber-600)]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 max-w-md font-heading text-3xl leading-tight text-hesya-navy-900 md:text-4xl">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-hesya-navy-900/70 md:text-lg">
                  {s.body}
                </p>
                <span
                  aria-hidden="true"
                  className={`mt-6 block h-[2px] bg-hesya-amber-500 transition-[width] duration-300 ${
                    i === 0 ? "w-16" : "w-0"
                  }`}
                />
              </li>
            ))}
          </ol>

          <div className="hidden md:block">
            <div
              role="img"
              aria-label="Mobile app preview — Show us a look"
              className="sticky top-32 mx-auto flex aspect-[9/19] w-full max-w-[280px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[2.5rem] border-8 border-hesya-navy-900 bg-hesya-peach-100 p-6 text-hesya-navy-900 shadow-2xl"
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
