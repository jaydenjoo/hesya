/**
 * O1 Dashboard fast track 단계 1 — W10 환불 Alert 배너.
 *
 * Reference: `docs/design/reference/dashboard.css` `.sd-alert`
 * - red border-left + light pink bg + warning icon + body + ghost action
 *
 * 표시 조건: dispute.active > 0 (page.tsx에서 분기).
 */

interface Props {
  readonly title: React.ReactNode;
  readonly body: React.ReactNode;
  readonly actionLabel: string;
}

export function CriticalAlert({ title, body, actionLabel }: Props) {
  return (
    <div
      role="alert"
      data-testid="dashboard-critical-alert"
      className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 border-l-[3px] border-l-red-500 bg-red-500/5 px-4 py-3 text-[13px]"
    >
      <span aria-hidden="true" className="text-[16px] text-red-500">
        ⚠
      </span>
      <span className="kr flex-1 text-hesya-navy-900">
        <strong className="font-semibold text-red-500">{title}</strong>
        {body ? <> — {body}</> : null}
      </span>
      <button
        type="button"
        className="kr flex-shrink-0 rounded-md border border-hesya-peach-200 px-2.5 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:border-hesya-amber-500 hover:text-hesya-amber-600"
      >
        {actionLabel} →
      </button>
    </div>
  );
}
