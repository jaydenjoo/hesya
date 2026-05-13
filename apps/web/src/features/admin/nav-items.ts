/**
 * Plan v3 M6 — Admin shell nav 정의 (운영자 sidebar).
 *
 * 그룹: 운영 (Dashboard / KYC / Disputes / Payment / Reports / Deletion / API alerts)
 *       시스템 (AI Cost / AI Accuracy).
 * labelKey는 i18n AdminShell.nav.*. 활성 매칭은 pathname.startsWith(href).
 */

export interface AdminNavItem {
  readonly key: string;
  readonly href: string;
  readonly labelKey: string;
  readonly icon: string;
}

export interface AdminNavCountMap {
  readonly [key: string]: { readonly count: number; readonly urgent?: boolean };
}

export interface AdminNavGroup {
  readonly key: string;
  readonly labelKey: string;
  readonly items: readonly AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    key: "ops",
    labelKey: "groupOps",
    items: [
      {
        key: "dashboard",
        href: "/admin/dashboard",
        labelKey: "dashboard",
        icon: "▦",
      },
      {
        key: "kyc",
        href: "/admin/store-verifications",
        labelKey: "kyc",
        icon: "✔",
      },
      {
        key: "disputes",
        href: "/admin/disputes",
        labelKey: "disputes",
        icon: "⚖",
      },
      {
        key: "payment",
        href: "/admin/payment-monitoring",
        labelKey: "payment",
        icon: "₩",
      },
      {
        key: "reports",
        href: "/admin/store-reports",
        labelKey: "reports",
        icon: "▤",
      },
      {
        key: "deletion",
        href: "/admin/store-deletion",
        labelKey: "deletion",
        icon: "⌫",
      },
      {
        key: "apiAlerts",
        href: "/admin/api-policy-alerts",
        labelKey: "apiAlerts",
        icon: "⚑",
      },
    ],
  },
  {
    key: "system",
    labelKey: "groupSystem",
    items: [
      {
        key: "aiCost",
        href: "/admin/ai-cost",
        labelKey: "aiCost",
        icon: "◈",
      },
      {
        key: "aiAccuracy",
        href: "/admin/ai-accuracy",
        labelKey: "aiAccuracy",
        icon: "◉",
      },
    ],
  },
];
