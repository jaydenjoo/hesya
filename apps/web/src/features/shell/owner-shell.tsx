import { getTranslations } from "next-intl/server";

import { NavSidebar } from "./nav-sidebar";
import { TopBar } from "./top-bar";

/**
 * Plan v3 Phase D1-A1 — Owner Shell (server component).
 *
 * Grid: 240px sidebar + 1fr main / 64px top bar + 1fr.
 * 모바일은 sidebar 숨기고 main 단독 (NavSidebar 내부에 lg:block).
 *
 * 사용: store/* 페이지에서 `<OwnerShell currentLocale={locale} ...>...<children></OwnerShell>`.
 * Session 정보 (storeName, userName, userInitial)는 caller에서 주입.
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
  readonly storeName: string;
  readonly userName: string;
  readonly userInitial: string;
  readonly children: React.ReactNode;
}

export async function OwnerShell({
  currentLocale,
  storeName,
  userName,
  userInitial,
  children,
}: Props) {
  const t = await getTranslations({
    locale: currentLocale,
    namespace: "OwnerShell",
  });

  return (
    <div className="grid min-h-screen bg-[#fafbfc] lg:grid-cols-[240px_1fr] lg:grid-rows-[64px_1fr]">
      <TopBar
        currentLocale={currentLocale}
        locales={LOCALE_OPTIONS}
        userInitial={userInitial}
        userName={userName}
        labels={{
          brandPill: t("brandPill"),
          searchPlaceholder: t("searchPlaceholder"),
          searchKbd: t("searchKbd"),
          signOut: t("signOut"),
          avatarAlt: t("avatarAlt"),
        }}
      />
      <NavSidebar
        storeName={storeName}
        labels={{
          sectionMain: t("sectionMain"),
          dashboard: t("nav.dashboard"),
          inbox: t("nav.inbox"),
          inboxSkipped: t("nav.inboxSkipped"),
          bookings: t("nav.bookings"),
          services: t("nav.services"),
          customers: t("nav.customers"),
          knowledge: t("nav.knowledge"),
          settings: t("nav.settings"),
          storeStatus: t("storeStatus"),
          storeStatusActive: t("storeStatusActive"),
        }}
      />
      <main className="row-start-2 lg:col-start-2 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
