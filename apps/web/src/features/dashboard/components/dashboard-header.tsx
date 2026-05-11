type Props = {
  title: string;
  subtitle: string;
};

/**
 * Epic 4 (ε) / Phase D4-D1 — 매장 운영 대시보드 헤더.
 *
 * 디자인 정합: services/customers/settings와 동일한 header 패턴 (Operator pill
 * + Fraunces italic 제목 + 부제).
 */
export function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-8 space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        Operator · Dashboard
      </p>
      <h1 className="font-heading text-3xl font-semibold italic tracking-tight text-hesya-navy-900">
        {title}
      </h1>
      <p className="text-sm text-hesya-navy-900/65">{subtitle}</p>
    </header>
  );
}
