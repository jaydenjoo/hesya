/**
 * Reference 정합 PR 6 — Owner shell nav 정의.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:28-37` Sidebar items.
 * 8 항목 (Dashboard / Inbox / Bookings / Services / Customers / Analytics /
 * AI Photos / Settings) — reference 순서 동일.
 *
 * 이전 11 항목 (inboxSkipped / knowledge / integrations 포함) 축소. 제거된
 * 항목들의 라우트는 유지 (페이지 자체는 보존, settings sub-menu에서 향후 link).
 */

export interface NavItem {
  readonly key: string;
  readonly href: string;
  readonly labelKey: string;
  readonly icon: string;
}

export interface NavCountMap {
  readonly [key: string]: { readonly count: number; readonly urgent?: boolean };
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "dashboard",
    href: "/store/dashboard",
    labelKey: "dashboard",
    icon: "▦",
  },
  { key: "inbox", href: "/store/inbox", labelKey: "inbox", icon: "✉" },
  { key: "bookings", href: "/store/bookings", labelKey: "bookings", icon: "▥" },
  { key: "services", href: "/store/services", labelKey: "services", icon: "✂" },
  {
    key: "customers",
    href: "/store/customers",
    labelKey: "customers",
    icon: "◉",
  },
  {
    key: "analytics",
    href: "/store/analytics",
    labelKey: "analytics",
    icon: "◫",
  },
  { key: "photos", href: "/store/photos", labelKey: "photos", icon: "✦" },
  { key: "settings", href: "/store/settings", labelKey: "settings", icon: "⚙" },
];
