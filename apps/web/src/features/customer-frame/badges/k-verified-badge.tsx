/**
 * Plan v3 Phase D1-A3 — K-Verified 사업자 인증 골드 배지.
 *
 * PRD § 6.5 K-Verified visual trust system. 외국인 손님이 매장을 신뢰할 수
 * 있는 핵심 시그널 (한국 사업자 등록 + 자유업/미용업 자격 확인 완료).
 * 사용: M2.1 detail 헤더, M2.5 payment trust row, store card.
 */

interface Props {
  readonly label: string;
  readonly size?: "sm" | "md";
}

export function KVerifiedBadge({ label, size = "sm" }: Props) {
  const padding =
    size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-kverified-gold/60 bg-gradient-to-r from-kverified-gold/20 to-kverified-gold/10 font-semibold uppercase tracking-[0.08em] text-[#7a6020] ${padding}`}
    >
      <span aria-hidden="true">✦</span>
      <span>{label}</span>
    </span>
  );
}
