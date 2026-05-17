export function MarketingSectionNum({
  value,
  tone = "light",
}: {
  value: string;
  tone?: "light" | "dark";
}) {
  const strokeClass =
    tone === "dark"
      ? "[-webkit-text-stroke:1.5px_var(--color-hesya-amber-500)]"
      : "[-webkit-text-stroke:1.5px_var(--color-hesya-amber-700)]";
  return (
    <span
      aria-hidden="true"
      role="presentation"
      className={`pointer-events-none absolute left-8 top-10 z-0 hidden font-heading text-[96px] italic leading-[0.9] tracking-[-0.04em] text-transparent md:text-[160px] lg:block ${strokeClass}`}
    >
      {value}
    </span>
  );
}
