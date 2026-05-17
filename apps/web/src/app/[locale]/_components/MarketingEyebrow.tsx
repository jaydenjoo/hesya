import type { ReactNode } from "react";

export function MarketingEyebrow({
  children,
  centered = false,
  tone = "light",
}: {
  children: ReactNode;
  centered?: boolean;
  tone?: "light" | "dark";
}) {
  const ruleColor =
    tone === "dark" ? "before:bg-hesya-amber-500" : "before:bg-hesya-amber-700";
  const textColor =
    tone === "dark" ? "text-hesya-peach-200" : "text-hesya-amber-700";
  const align = centered ? "justify-center" : "";
  return (
    <p
      className={`mb-5 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${textColor} ${align} before:inline-block before:h-px before:w-[22px] before:content-[''] ${ruleColor}`}
    >
      {children}
    </p>
  );
}
