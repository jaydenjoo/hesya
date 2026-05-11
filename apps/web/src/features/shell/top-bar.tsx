"use client";

/**
 * Plan v3 Phase D1-A1 — Owner Shell TopBar.
 *
 * 64px 높이, 브랜드 + 검색(⌘K placeholder) + locale 토글 + 알림 + 아바타.
 * 검색은 현재 placeholder only (Phase D2 이후 실제 wire).
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
  readonly signOut: string;
  readonly avatarAlt: string;
}

interface Props {
  readonly currentLocale: string;
  readonly locales: readonly LocaleOption[];
  readonly userInitial: string;
  readonly userName: string;
  readonly labels: TopBarLabels;
}

export function TopBar({
  currentLocale,
  locales,
  userInitial,
  userName,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(pathname, { locale: newLocale as "ko" });
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
    <header className="row-start-1 col-span-2 z-50 flex items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
      <div className="flex w-56 flex-shrink-0 items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border-[1.5px] border-hesya-navy-900 font-heading text-[15px] font-semibold italic tracking-tight text-hesya-navy-900">
          H
        </span>
        <span className="font-heading text-lg font-semibold italic text-hesya-navy-900">
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
          className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-10 text-[13px] text-hesya-navy-900 outline-none transition placeholder:text-gray-400 focus:border-hesya-navy-900 focus:bg-white focus:shadow-[0_0_0_3px_rgba(26,34,56,0.06)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500 lg:block">
          {labels.searchKbd}
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <select
          aria-label="Locale"
          value={currentLocale}
          onChange={handleLocaleChange}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-hesya-navy-900 outline-none focus:border-hesya-navy-900"
        >
          {locales.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-md text-hesya-navy-900 transition hover:bg-gray-50"
        >
          <span aria-hidden="true" className="text-base">
            ◔
          </span>
        </button>

        <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
          <span
            aria-label={labels.avatarAlt}
            className="grid h-8 w-8 place-items-center rounded-full bg-hesya-amber-500 text-sm font-semibold text-hesya-navy-900"
          >
            {userInitial}
          </span>
          <span className="hidden font-medium text-hesya-navy-900 lg:inline text-[13px]">
            {userName}
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
