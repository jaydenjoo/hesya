/**
 * Plan v3 Phase D1-A3 — Trust Pill.
 *
 * 결제 페이지(M2.5) 등에서 신뢰 시그널 row 구성. 아이콘 + 짧은 한 줄.
 * 예: 🔒 256-bit SSL / 💳 PCI DSS / ↩️ 24-hr free cancel / 🛡️ Hesya guarantees.
 */

interface Props {
  readonly icon: string;
  readonly label: string;
}

export function TrustPill({ icon, label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hesya-peach-200 bg-white px-2.5 py-1 text-[10px] font-medium text-hesya-navy-900/75">
      <span aria-hidden="true" className="text-xs">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}
