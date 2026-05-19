"use client";

/**
 * Plan v3 M6 — Admin Shell TopBar.
 *
 * 디자인 ref: `admin-chrome.css` `.ad-topbar` + Hesya Admin Dashboard.html.
 * 64px 높이, 브랜드(ADMIN pill) + 검색 + env chip + 알림 + 운영자 chip.
 * 검색은 placeholder only (시각 정합성 우선). 운영자 아바타 클릭 → 로그아웃.
 */

import { useState } from "react";
import { createAuthClient } from "@hesya/auth/client";

import { usePathname, useRouter } from "@/i18n/navigation";

const authClient = createAuthClient();

interface LocaleOption {
  readonly code: string;
  readonly label: string;
}

interface TopBarLabels {
  readonly brandPill: string;
  readonly searchPlaceholder: string;
  readonly searchKbd: string;
  readonly notificationsLabel: string;
  readonly signOut: string;
}

interface Props {
  readonly currentLocale: string;
  readonly locales: readonly LocaleOption[];
  readonly envBadge: string;
  readonly userInitial: string;
  readonly userName: string;
  readonly userRole: string;
  readonly notificationCount?: number;
  readonly labels: TopBarLabels;
}

export function AdminTopBar({
  currentLocale,
  locales,
  envBadge,
  userInitial,
  userName,
  userRole,
  notificationCount = 0,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(pathname, { locale: e.target.value as "ko" });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/sign-in");
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <header className="col-span-2 row-start-1 z-50 flex items-center gap-4 border-b border-gray-100 bg-white px-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
      <div className="flex w-56 flex-shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-md border-[1.5px] border-hesya-navy-900 font-heading text-[15px] font-semibold italic tracking-tight text-hesya-navy-900"
        >
          H
        </span>
        <span className="font-heading text-lg font-semibold italic tracking-tight text-hesya-navy-900">
          Hesya
        </span>
        <span className="ml-1 rounded bg-hesya-navy-900 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.22em] text-hesya-peach-100">
          {labels.brandPill}
        </span>
      </div>

      <div className="relative mx-6 hidden max-w-md flex-1 md:block">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
        >
          ⌕
        </span>
        <input
          type="search"
          placeholder={labels.searchPlaceholder}
          className="h-9 w-full rounded-md border border-gray-100 bg-[#fafbfc] px-10 text-[13px] text-hesya-navy-900 outline-none transition placeholder:text-gray-400 focus:border-hesya-navy-900 focus:bg-white focus:shadow-[0_0_0_3px_rgba(26,34,56,0.06)]"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-gray-100 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500 lg:block">
          {labels.searchKbd}
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded border border-gray-100 bg-[#fafbfc] px-2.5 py-1 font-mono text-[10.5px] text-gray-500">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
          {envBadge}
        </span>

        <select
          aria-label="Locale"
          value={currentLocale}
          onChange={handleLocaleChange}
          className="rounded-md border border-gray-100 bg-white px-2 py-1.5 text-xs text-hesya-navy-900 outline-none focus:border-hesya-navy-900"
        >
          {locales.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-label={labels.notificationsLabel}
          className="relative grid h-9 w-9 place-items-center rounded-md border border-gray-100 bg-white text-gray-500 transition hover:border-hesya-navy-900 hover:text-hesya-navy-900"
        >
          <span aria-hidden="true" className="text-sm">
            🔔
          </span>
          {notificationCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-hesya-danger-600 px-1 font-mono text-[9.5px] font-bold leading-none text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </button>

        <div className="ml-1 flex items-center gap-2.5 rounded-lg px-2 py-1 transition hover:bg-gray-50">
          <div className="hidden text-right lg:block">
            <div className="text-[12.5px] font-semibold leading-tight text-hesya-navy-900">
              {userName}
            </div>
            <div className="mt-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">
              {userRole}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-hesya-navy-900 to-[#2a3552] text-[12.5px] font-semibold text-hesya-peach-100"
          >
            {userInitial}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="ml-1 rounded-md px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {labels.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}
