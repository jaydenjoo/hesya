/**
 * Plan v3 Phase D1-A3 — 언어 배지.
 *
 * 매장이 지원하는 언어를 시각 표시 (M2.1 detail, M2.3 schedule 스타일리스트
 * 카드 등에서 사용). emoji flag + 짧은 라벨.
 */

const FLAG: Record<string, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  ja: "🇯🇵",
  vi: "🇻🇳",
  "zh-CN": "🇨🇳",
  "zh-TW": "🇹🇼",
  zh: "🇨🇳",
};

interface Props {
  readonly locale: string;
  readonly label: string;
  readonly tone?: "neutral" | "accent";
}

export function LangPill({ locale, label, tone = "neutral" }: Props) {
  const cls =
    tone === "accent"
      ? "border-hesya-amber-500/40 bg-hesya-amber-50 text-hesya-amber-700"
      : "border-hesya-peach-200 bg-white text-hesya-navy-900/70";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      <span aria-hidden="true">{FLAG[locale] ?? "🌐"}</span>
      <span>{label}</span>
    </span>
  );
}
