import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 3 — W6 K-Verified 상태 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:374-396` `TileVerified`.
 * ribbon ✓ + "인증 완료" band + 메타 (레벨 / 다음 재검증) + 검증 이력 링크.
 *
 * **mock-first**: 실 데이터 prerequisite은 kyc schema 확장 (`tier` enum +
 * `renewalDueAt` 컬럼) — 별도 task. 본 컴포넌트는 page.tsx에서 mock 주입.
 * 검증 이력 링크는 Stage 1 패턴 (disabled + "곧 출시" tooltip).
 */

interface Props {
  /** K-Verified tier — Gold / Silver / Bronze 등 */
  readonly tier: string;
  /** 다음 재검증 날짜 ISO (YYYY-MM-DD) */
  readonly renewalDate: string;
  /** "곧 출시" tooltip 텍스트 (Dashboard.timeline.popoverComingSoon 재활용) */
  readonly comingSoonLabel: string;
}

export function KVerified({ tier, renewalDate, comingSoonLabel }: Props) {
  const t = useTranslations("Dashboard.kVerified");

  return (
    <section
      data-testid="dashboard-k-verified"
      aria-label={t("title")}
      className="tile-reveal flex flex-col rounded-lg border border-hesya-peach-200 bg-white p-5"
      style={{ animationDelay: "200ms" }}
    >
      <header className="mb-4">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
      </header>

      <div className="mb-4 flex items-center gap-3 rounded-md bg-hesya-amber-500/10 px-3 py-2.5">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-hesya-amber-500 text-[14px] font-bold text-white"
        >
          ✓
        </span>
        <span className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("statusVerified")}
        </span>
      </div>

      <dl className="mb-4 space-y-1.5 text-[12px]">
        <div className="kr flex items-center gap-2">
          <dt className="text-gray-500">{t("levelLabel")}</dt>
          <dd className="font-medium text-hesya-navy-900">{tier}</dd>
        </div>
        <div className="kr flex items-center gap-2">
          <dt className="text-gray-500">{t("renewalLabel")}</dt>
          <dd className="mono tabular-nums text-hesya-navy-900">
            {renewalDate}
          </dd>
        </div>
      </dl>

      <span
        className="kr mt-auto cursor-not-allowed text-[12px] text-hesya-amber-600 hover:underline"
        title={comingSoonLabel}
        aria-disabled="true"
      >
        {t("historyLink")} →
      </span>
    </section>
  );
}
