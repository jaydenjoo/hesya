/**
 * Plan v3 Phase D1-A1 — Owner shell nav 정의.
 *
 * 라우트와 라벨 매핑. label은 i18n key (OwnerShell.nav.*).
 * 활성 매칭은 pathname.startsWith(href) (locale prefix는 사용처에서 제거).
 */

export interface NavItem {
  readonly key: string;
  readonly href: string;
  readonly labelKey: string;
  readonly icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "dashboard",
    href: "/store/dashboard",
    labelKey: "dashboard",
    icon: "▦",
  },
  { key: "inbox", href: "/store/inbox", labelKey: "inbox", icon: "✉" },
  { key: "bookings", href: "/store/bookings", labelKey: "bookings", icon: "▢" },
  { key: "services", href: "/store/services", labelKey: "services", icon: "✦" },
  {
    key: "customers",
    href: "/store/customers",
    labelKey: "customers",
    icon: "◍",
  },
  {
    key: "knowledge",
    href: "/store/knowledge",
    labelKey: "knowledge",
    icon: "❋",
  },
  { key: "settings", href: "/store/settings", labelKey: "settings", icon: "✱" },
];
