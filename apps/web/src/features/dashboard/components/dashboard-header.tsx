type Props = {
  title: string;
  subtitle: string;
};

/**
 * Epic 4 (ε) — 매장 운영 대시보드 헤더.
 *
 * 기간 필터(week/month/quarter)는 Epic 2/3 실측 데이터 도입 후 추가 (별 PR).
 */
export function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-8 space-y-2">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
        {title}
      </h1>
      <p className="text-sm text-hesya-navy-900/70">{subtitle}</p>
    </header>
  );
}
