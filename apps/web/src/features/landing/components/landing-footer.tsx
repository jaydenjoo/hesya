import Link from "next/link";

type Props = {
  locale: string;
  /** 우측 hint 카피 */
  hint: string;
};

const LOCALES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "vi", label: "Tiếng Việt" },
];

/**
 * γ.2.3.5 — landing footer (minimal).
 *
 * 브랜드 마크 + locale 스위처 + hint. 가격/About/Blog 등 마케팅 sub-pages는
 * 베타 출시 후 phase에서 도입.
 */
export function LandingFooter({ locale, hint }: Props) {
  return (
    <footer className="border-t border-hesya-peach-100 bg-hesya-peach-50/40 px-5 py-8 sm:px-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold tracking-[-0.02em] text-hesya-navy-900">
          Hesya
        </span>
        <nav
          aria-label="languages"
          className="flex flex-wrap gap-x-3 gap-y-1 text-xs"
        >
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href={`/${l.code}`}
              aria-current={l.code === locale ? "page" : undefined}
              className={`transition-colors hover:text-hesya-amber-500 ${
                l.code === locale
                  ? "font-medium text-hesya-navy-900"
                  : "text-hesya-navy-900/60"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-xs text-hesya-navy-900/50">{hint}</span>
      </div>
    </footer>
  );
}
