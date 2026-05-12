import { PageHeader } from "@/components/ui/page-header";

type Props = {
  eyebrow: string;
  greetingPrefix: string;
  storeName: string;
  greetingSuffix: string;
  subtitle: string;
  dateDay: string;
  dateWeekday: string;
};

/**
 * Epic 4 (ε) / M6.2 — 매장 운영 대시보드 헤더.
 *
 * 디자인 reference: dashboard.css `.sd-greeting`.
 * - title: 인사 + storeName을 Fraunces italic amber-600으로 강조
 * - right: 날짜 (day + weekday) — sd-date 패턴
 */
export function DashboardHeader({
  eyebrow,
  greetingPrefix,
  storeName,
  greetingSuffix,
  subtitle,
  dateDay,
  dateWeekday,
}: Props) {
  return (
    <PageHeader
      variant="page"
      eyebrow={eyebrow}
      title={
        <>
          {greetingPrefix}
          <em className="font-heading not-italic text-hesya-amber-600">
            {" "}
            <span className="italic">{storeName}</span>{" "}
          </em>
          {greetingSuffix}
        </>
      }
      subtitle={subtitle}
      right={
        <div className="text-right font-mono">
          <p className="text-[13px] font-semibold tracking-wide text-hesya-navy-900">
            {dateDay}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">{dateWeekday}</p>
        </div>
      }
    />
  );
}
