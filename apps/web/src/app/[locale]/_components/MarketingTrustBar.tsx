import { useTranslations } from "next-intl";

export function MarketingTrustBar() {
  const t = useTranslations("MarketingLanding");
  const stats = [
    t("trustStatRating"),
    t("trustStatVerified"),
    t("trustStatLanguages"),
    t("trustStatSafety"),
    t("trustStatChat"),
  ];

  return (
    <aside
      aria-label="Trust stats"
      className="border-y border-hesya-peach-200/60 bg-hesya-peach-100 px-6 py-7"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-hesya-navy-900/85">
        {stats.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-3">
            <span>{s}</span>
            {i < stats.length - 1 ? (
              <span
                aria-hidden="true"
                className="hidden text-hesya-navy-900/30 sm:inline"
              >
                ·
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </aside>
  );
}
