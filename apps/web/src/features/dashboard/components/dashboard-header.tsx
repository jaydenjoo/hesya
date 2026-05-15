import { PageHeader } from "@/components/ui/page-header";

type Props = {
  /** Reference 정합 PR 4 — 제거됨. 기존 caller 호환을 위한 optional. 미전달
      시 PageHeader eyebrow 없음. */
  eyebrow?: string;
  greetingPrefix: string;
  storeName: string;
  greetingSuffix: string;
  /**
   * O1 fast track 단계 1 — W13 동적 subtitle.
   * ReactNode 허용 → `t.rich`로 `<strong>` count 강조 가능.
   */
  subtitle: React.ReactNode;
  dateDay: string;
  dateWeekday: string;
  /**
   * O1 fast track 100% — W12 우선순위 보기 버튼.
   * Reference `dashboard-app.jsx:941` `sd-btn-amber sd-priority`.
   * 라벨 미지정 시 버튼 미표시. 클릭 액션은 추후 wire (현재 mock).
   */
  priorityLabel?: string;
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
  priorityLabel,
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
        <div className="flex flex-col items-end gap-2">
          <div className="text-right font-mono">
            <p className="text-[13px] font-semibold tracking-wide text-hesya-navy-900">
              {dateDay}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">{dateWeekday}</p>
          </div>
          {priorityLabel ? (
            <button
              type="button"
              data-testid="dashboard-priority-button"
              className="kr inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-hesya-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
            >
              <span aria-hidden="true">📌</span>
              {priorityLabel}
            </button>
          ) : null}
        </div>
      }
    />
  );
}
