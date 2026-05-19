"use client";

/**
 * Reference 정합 PR 6 — Owner Shell NavSidebar.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:27-63` Sidebar + .sd-nav,
 * .sd-store CSS.
 *
 * 변경:
 * - active 스타일: navy-900 fill → peach-100 bg + left 3px amber-500 accent bar
 * - 36×36 navy gradient 로고 박스 + italic "S"
 * - "메뉴" eyebrow 제거 (reference에 없음)
 * - 8 항목 (NAV_ITEMS) — Dashboard / Inbox / Bookings / Services / Customers /
 *   Analytics / AI Photos / Settings
 */

import { Link, usePathname } from "@/i18n/navigation";

import { NAV_ITEMS, type NavCountMap } from "./nav-items";

interface NavLabels {
  readonly dashboard: string;
  readonly inbox: string;
  readonly bookings: string;
  readonly services: string;
  readonly customers: string;
  readonly analytics: string;
  readonly photos: string;
  readonly settings: string;
  readonly storeStatus: string;
  readonly storeStatusActive: string;
  readonly storeLogoAlt: string;
}

interface Props {
  readonly storeName: string;
  readonly labels: NavLabels;
  readonly counts?: NavCountMap;
}

/** 매장명 첫 글자 — 로고 박스 italic 표시 (reference sd-store-logo "S"). */
function getStoreInitial(storeName: string): string {
  const first = storeName.trim().charAt(0);
  return first || "S";
}

export function NavSidebar({ storeName, labels, counts }: Props) {
  const pathname = usePathname();
  const storeInitial = getStoreInitial(storeName);

  return (
    <aside className="row-start-2 col-start-1 hidden w-[240px] border-r border-hesya-peach-200 bg-white px-3 pb-4 pt-5 lg:flex lg:flex-col">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = counts?.[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-hesya-peach-100 font-semibold text-hesya-navy-900 before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-hesya-amber-500"
                  : "text-gray-700 hover:bg-hesya-peach-50",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex w-4 flex-shrink-0 justify-center text-[15px]",
                  active ? "text-hesya-amber-600" : "text-gray-500",
                ].join(" ")}
              >
                {item.icon}
              </span>
              <span className="kr flex-1 truncate">
                {labels[item.labelKey as keyof NavLabels]}
              </span>
              {badge && badge.count > 0 ? (
                <span
                  className={[
                    "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold leading-none",
                    badge.urgent
                      ? "bg-hesya-danger-600 text-white"
                      : "bg-hesya-amber-500 text-white",
                  ].join(" ")}
                >
                  {badge.count > 99 ? "99+" : badge.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-hesya-peach-100 pt-4">
        <span
          aria-label={labels.storeLogoAlt}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-hesya-navy-900 to-hesya-navy-900/85 font-heading text-[16px] font-semibold italic text-hesya-peach-50"
        >
          {storeInitial}
        </span>
        <div className="kr flex min-w-0 flex-col gap-0.5 text-[11px] leading-tight">
          <span className="truncate font-semibold text-hesya-navy-900">
            {storeName}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            {labels.storeStatus}
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            <span className="text-emerald-600">{labels.storeStatusActive}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
