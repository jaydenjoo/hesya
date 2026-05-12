/**
 * Plan v3 M6 Phase 0 — 공통 페이지 헤더.
 *
 * 디자인 reference: settings.css `.set-pageheader` (sticky 변형)
 *                  + dashboard.css `.sd-greeting` (italic em accent 변형).
 *
 * Variant:
 *  - "sticky": peach-100 border + 92% peach bg + backdrop-blur. Settings/Inbox 등 fixed top.
 *  - "page":   문서 흐름 안 inline header. Dashboard 인사 영역.
 *
 * Layout: left (eyebrow + title + optional subtitle) + right slot (액션/메타).
 */

interface Props {
  readonly eyebrow?: string;
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly variant?: "sticky" | "page";
  readonly right?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  variant = "sticky",
  right,
}: Props) {
  const wrapperClass =
    variant === "sticky"
      ? "sticky top-0 z-[4] flex items-end justify-between gap-6 border-b border-hesya-peach-100 bg-hesya-peach-50/95 px-8 py-5 backdrop-blur-md"
      : "flex items-start justify-between gap-6 px-8 pt-8 pb-4";

  return (
    <header className={wrapperClass}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? (
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={
            variant === "sticky"
              ? "text-[22px] font-bold leading-tight tracking-[-0.015em] text-hesya-navy-900"
              : "text-[28px] font-semibold leading-tight tracking-[-0.01em] text-hesya-navy-900"
          }
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[13px] text-gray-600">{subtitle}</p>
        ) : null}
      </div>
      {right ? (
        <div className="flex flex-shrink-0 items-center gap-3">{right}</div>
      ) : null}
    </header>
  );
}
