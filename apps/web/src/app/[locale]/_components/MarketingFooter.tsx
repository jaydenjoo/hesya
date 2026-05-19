import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const SOCIALS = [
  { label: "Instagram", glyph: "◉", tint: undefined },
  { label: "Xiaohongshu", glyph: "红", tint: "text-[#FE2C55]" },
  { label: "TikTok", glyph: "♪", tint: undefined },
  { label: "LINE", glyph: "L", tint: "text-[#06C755]" },
] as const;

const LINK_COLS = [
  {
    header: "For travelers",
    links: [
      { label: "About Hesya", href: "#about" },
      { label: "How it works", href: "#travelers" },
      { label: "Featured salons", href: "#salons" },
      { label: "Reviews", href: "#reviews" },
      { label: "Safety guide", href: "#safety" },
      { label: "Trending looks", href: "/trending" },
    ],
  },
  {
    header: "For salons",
    links: [
      { label: "Become a partner", href: "#salons" },
      { label: "Pricing", href: "/pricing" },
      { label: "Store dashboard sign-in", href: "/sign-in" },
      { label: "Onboarding guide", href: "/onboarding/kyc" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
    ],
  },
  {
    header: "Company",
    links: [
      { label: "About us", href: "#about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Trending", href: "/trending" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Find salon", href: "/c" },
    ],
  },
] as const;

export function MarketingFooter() {
  const t = useTranslations("MarketingLanding");

  return (
    // Reference Hesya Landing.html L1062 — padding 64px 32px 32px
    <footer className="bg-hesya-peach-100 px-8 pb-8 pt-16 text-hesya-navy-900">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            {/* Reference Hesya Landing.html L1073-1076 — h3 32px / -0.02em */}
            <h3 className="font-heading text-[32px] tracking-[-0.02em]">
              {t("footerBrand")}
            </h3>
            <p className="mt-3 max-w-sm text-sm text-hesya-navy-900/70">
              {t("footerTagline")}
            </p>
            <ul role="list" className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href="#"
                    aria-label={s.label}
                    className={`grid h-10 w-10 place-items-center rounded-full bg-white/70 transition hover:bg-white ${s.tint ?? ""}`}
                  >
                    <span aria-hidden="true">{s.glyph}</span>
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 inline-flex items-center rounded-full border border-hesya-navy-900/20 px-4 py-2 text-sm transition hover:bg-white"
            >
              {t("footerLangSwitch")}
            </button>
          </div>
          {LINK_COLS.map((col) => (
            <div key={col.header}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-hesya-navy-900">
                {col.header}
              </h4>
              <ul
                role="list"
                className="mt-4 space-y-1 text-sm text-hesya-navy-700"
              >
                {col.links.map((link) =>
                  link.href.startsWith("#") ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="block py-1 transition hover:text-hesya-navy-900"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="block py-1 transition hover:text-hesya-navy-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Reference Hesya Landing.html L1120 — border-top hesya-peach-200 */}
        <div className="mt-12 grid items-center gap-4 border-t border-hesya-peach-200 pt-6 md:grid-cols-[1fr_auto_1fr]">
          <p className="text-xs text-hesya-navy-700">
            © 2026 Hesya, Inc. · ISO 27001 · GDPR
          </p>
          <div
            aria-hidden="true"
            className="hidden h-px w-20 bg-trust-rose md:block"
          />
          <Link
            href="/admin"
            className="text-xs text-hesya-navy-700 transition hover:text-hesya-navy-900 md:text-right"
          >
            Internal · Operations →
          </Link>
        </div>
      </div>
    </footer>
  );
}
