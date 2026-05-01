import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type KVerifiedBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Show "Korea Government Verified" label inline (default). Hide for icon-only. */
  showLabel?: boolean;
  /** Locale for the inline label — defaults to English (foreign-tourist surface). */
  locale?: "en" | "ko";
};

/**
 * KVerifiedBadge — gold trust marker for stores whose verification_status
 * is `auto_approved` or `approved` (PRD § 6.5).
 *
 * Rules baked in:
 *   - Customer-facing surfaces only — never render on operator/admin pages.
 *   - The caller is responsible for gating render on verification_status.
 *   - Single visual emphasis colour: --kverified-gold (#D4AF37).
 */
export function KVerifiedBadge({
  showLabel = true,
  locale = "en",
  className,
  ...rest
}: KVerifiedBadgeProps) {
  const label =
    locale === "ko" ? "정부 검증 매장" : "Korea Government Verified";

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        "border border-[color:var(--kverified-gold)]/40",
        "bg-[color:var(--kverified-gold)]/10 text-[color:var(--hesya-navy-900)]",
        className,
      )}
      {...rest}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="var(--kverified-gold)"
      >
        <path d="M8 1.5l1.6 3.5 3.9.4-2.9 2.6.9 3.8L8 9.9l-3.5 1.9.9-3.8L2.5 5.4l3.9-.4z" />
      </svg>
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}
