"use client";

/**
 * Plan v3 Phase D1-A1 — Owner Shell NavSidebar.
 *
 * 240px 폭, 8-item nav. 활성 상태: navy-900 bg + peach-50 text + amber 아이콘.
 * pathname.startsWith(href) 매칭 (locale prefix 제거 후).
 */

import { Link, usePathname } from "@/i18n/navigation";

import { NAV_ITEMS } from "./nav-items";

interface NavLabels {
  readonly sectionMain: string;
  readonly dashboard: string;
  readonly inbox: string;
  readonly inboxSkipped: string;
  readonly bookings: string;
  readonly services: string;
  readonly customers: string;
  readonly knowledge: string;
  readonly settings: string;
  readonly storeStatus: string;
  readonly storeStatusActive: string;
}

interface Props {
  readonly storeName: string;
  readonly labels: NavLabels;
}

export function NavSidebar({ storeName, labels }: Props) {
  const pathname = usePathname();

  return (
    <aside className="row-start-2 col-start-1 hidden border-r border-gray-200 bg-white px-3 py-5 lg:block">
      <div className="mb-4 px-3">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-gray-500">
          {labels.sectionMain}
        </p>
      </div>
      <nav className="flex flex-col gap-px">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-hesya-navy-900 font-semibold text-hesya-peach-50"
                  : "text-hesya-navy-900 hover:bg-gray-50",
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
              <span className="flex-1 truncate">
                {labels[item.labelKey as keyof NavLabels]}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-gray-100 px-3 pt-4">
        <p className="font-mono text-[10.5px] leading-relaxed text-gray-500">
          <span className="block truncate text-hesya-navy-900">
            {storeName}
          </span>
          <span>{labels.storeStatus}</span>
          <span className="ml-1 inline-flex items-center gap-1 text-emerald-600">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            {labels.storeStatusActive}
          </span>
        </p>
      </div>
    </aside>
  );
}
