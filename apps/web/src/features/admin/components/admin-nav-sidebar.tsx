"use client";

/**
 * Plan v3 M6 — Admin Shell NavSidebar.
 *
 * 디자인 ref: `docs/design/reference/admin-chrome.css` `.ad-sb-*` + Hesya Admin Dashboard.html.
 * 240px 폭, 2 그룹(운영 / 시스템), foot status 3 row.
 */

import { Link, usePathname } from "@/i18n/navigation";

import {
  ADMIN_NAV_GROUPS,
  type AdminNavCountMap,
  type AdminNavItem,
} from "../nav-items";

interface NavLabels {
  readonly groupOps: string;
  readonly groupSystem: string;
  readonly dashboard: string;
  readonly kyc: string;
  readonly disputes: string;
  readonly payment: string;
  readonly reports: string;
  readonly deletion: string;
  readonly apiAlerts: string;
  readonly aiCost: string;
  readonly aiAccuracy: string;
  readonly footApiLabel: string;
  readonly footDbLagLabel: string;
}

interface Props {
  readonly labels: NavLabels;
  readonly counts?: AdminNavCountMap;
  readonly buildVersion?: string;
  readonly buildId?: string;
  readonly apiUptime?: string;
  readonly dbLag?: string;
}

export function AdminNavSidebar({
  labels,
  counts,
  buildVersion = "v2.6.4",
  buildId = "build #4892",
  apiUptime = "99.98%",
  dbLag = "12ms",
}: Props) {
  const pathname = usePathname();

  const renderItem = (item: AdminNavItem) => {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const badge = counts?.[item.key];
    const label = labels[item.labelKey as keyof NavLabels];

    return (
      <Link
        key={item.key}
        href={item.href}
        className={[
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors",
          active
            ? "bg-hesya-navy-900 font-semibold text-hesya-peach-50"
            : "font-medium text-hesya-navy-900 hover:bg-gray-50",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "flex w-4 flex-shrink-0 justify-center text-sm",
            active ? "text-hesya-amber-500" : "text-gray-500",
          ].join(" ")}
        >
          {item.icon}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {badge && badge.count > 0 ? (
          <span
            className={[
              "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold leading-none",
              badge.urgent
                ? "bg-[#c9483a] text-white"
                : active
                  ? "bg-hesya-amber-500 text-hesya-navy-900"
                  : "bg-hesya-peach-200 text-hesya-navy-900",
            ].join(" ")}
          >
            {badge.count > 99 ? "99+" : badge.count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <aside className="col-start-1 row-start-2 hidden border-r border-gray-100 bg-white px-3 py-5 lg:block">
      {ADMIN_NAV_GROUPS.map((group, idx) => (
        <div key={group.key} className={idx === 0 ? "mb-4" : "mb-4 mt-2"}>
          <div className="mb-2 px-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-500">
              {labels[group.labelKey as keyof NavLabels]}
            </p>
          </div>
          <nav className="flex flex-col gap-px">
            {group.items.map(renderItem)}
          </nav>
        </div>
      ))}

      <div className="mt-8 border-t border-gray-100 px-3 pt-4">
        <dl className="space-y-1 font-mono text-[10.5px] text-gray-500">
          <div className="flex items-center justify-between">
            <dt>{labels.footApiLabel}</dt>
            <dd className="text-emerald-600">{apiUptime}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{labels.footDbLagLabel}</dt>
            <dd className="text-emerald-600">{dbLag}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{buildVersion}</dt>
            <dd>{buildId}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
