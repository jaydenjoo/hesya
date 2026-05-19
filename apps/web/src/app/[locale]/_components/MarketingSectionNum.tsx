/**
 * Reference: `docs/design/reference/Hesya Landing.html` `.mk-num`.
 *
 * Reference 정합 spec:
 *   - font-weight: 500 (Fraunces medium italic) — 400 italic은 swash 곡선 누락
 *   - stroke: light tone = amber-600, dark tone = amber-500
 *
 * Note (L-104 refinement): `layout.tsx`의 Fraunces weight 배열에 "500" 추가는
 * 폰트 *로드*만 보장. Tailwind className에 `font-medium`이 없으면 실제 적용 안 됨.
 * 토큰 검증 시 "로드 가능" ≠ "적용됨" 구분 필요.
 */
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
      : "[-webkit-text-stroke:1.5px_var(--color-hesya-amber-600)]";
  return (
    <span
      aria-hidden="true"
      role="presentation"
      className={`pointer-events-none absolute left-8 top-10 z-0 hidden font-heading text-[96px] font-medium italic leading-[0.9] tracking-[-0.04em] text-transparent md:text-[160px] lg:block ${strokeClass}`}
    >
      {value}
    </span>
  );
}
