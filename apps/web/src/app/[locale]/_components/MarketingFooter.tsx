import { useTranslations } from "next-intl";

const SOCIALS = [
  { label: "Instagram", glyph: "◉", tint: undefined },
  { label: "Xiaohongshu", glyph: "红", tint: "text-[#FE2C55]" },
  { label: "TikTok", glyph: "♪", tint: undefined },
  { label: "LINE", glyph: "L", tint: "text-[#06C755]" },
] as const;

export function MarketingFooter() {
  const t = useTranslations("MarketingLanding");

  return (
    <footer className="border-t border-hesya-peach-50/10 bg-hesya-navy-900 px-6 py-12 text-hesya-peach-50/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-2xl text-hesya-peach-50">
            {t("footerBrand")}
          </h3>
          <p className="mt-2 text-sm">{t("footerTagline")}</p>
        </div>

        <ul role="list" className="flex items-center gap-3">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a
                href="#"
                aria-label={s.label}
                className={`grid h-10 w-10 place-items-center rounded-full bg-hesya-peach-50/10 transition hover:bg-hesya-peach-50/20 ${s.tint ?? ""}`}
              >
                <span aria-hidden="true">{s.glyph}</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="rounded-full border border-hesya-peach-50/30 px-4 py-2 text-sm transition hover:bg-hesya-peach-50/10"
        >
          {t("footerLangSwitch")}
        </button>
      </div>
    </footer>
  );
}
