import { getTranslations } from "next-intl/server";

import { AdminNavSidebar } from "./admin-nav-sidebar";
import { AdminTopBar } from "./admin-top-bar";
import type { AdminNavCountMap } from "../nav-items";

/**
 * Plan v3 M6 — Admin Shell (server component, sub-page 공유 chrome).
 *
 * 디자인 ref: `docs/design/reference/admin-chrome.css` `.ad-shell`.
 * Grid: 240px sidebar + 1fr main / 64px top bar + 1fr.
 * 모바일은 sidebar 숨김 + main 단독.
 *
 * Phase 1 적용 범위: `/admin/dashboard` (이번 PR). 다른 sub-page는 후속 PR.
 */

const LOCALE_OPTIONS = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
] as const;

interface Props {
  readonly currentLocale: string;
  readonly userName: string;
  readonly userRole: string;
  readonly userInitial: string;
  readonly envBadge: string;
  readonly notificationCount?: number;
  readonly navCounts?: AdminNavCountMap;
  readonly children: React.ReactNode;
}

export async function AdminShell({
  currentLocale,
  userName,
  userRole,
  userInitial,
  envBadge,
  notificationCount,
  navCounts,
  children,
}: Props) {
  const t = await getTranslations({
    locale: currentLocale,
    namespace: "AdminShell",
  });

  return (
    <div className="grid min-h-screen bg-[#fafbfc] lg:grid-cols-[240px_1fr] lg:grid-rows-[64px_1fr]">
      <AdminTopBar
        currentLocale={currentLocale}
        locales={LOCALE_OPTIONS}
        envBadge={envBadge}
        userInitial={userInitial}
        userName={userName}
        userRole={userRole}
        notificationCount={notificationCount}
        labels={{
          brandPill: t("brandPill"),
          searchPlaceholder: t("searchPlaceholder"),
          searchKbd: t("searchKbd"),
          notificationsLabel: t("notificationsLabel"),
          signOut: t("signOut"),
        }}
      />
      <AdminNavSidebar
        counts={navCounts}
        labels={{
          groupOps: t("nav.groupOps"),
          groupSystem: t("nav.groupSystem"),
          dashboard: t("nav.dashboard"),
          kyc: t("nav.kyc"),
          disputes: t("nav.disputes"),
          payment: t("nav.payment"),
          reports: t("nav.reports"),
          deletion: t("nav.deletion"),
          apiAlerts: t("nav.apiAlerts"),
          aiCost: t("nav.aiCost"),
          aiAccuracy: t("nav.aiAccuracy"),
          footApiLabel: t("foot.apiLabel"),
          footDbLagLabel: t("foot.dbLagLabel"),
        }}
      />
      <main className="col-start-1 row-start-2 overflow-y-auto lg:col-start-2">
        {children}
      </main>
    </div>
  );
}
