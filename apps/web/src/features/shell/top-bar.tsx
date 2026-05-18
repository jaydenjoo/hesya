"use client";

/**
 * Reference 정합 PR 5 — Owner Shell TopBar.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:66-89` `TopHeader` +
 * `docs/design/reference/dashboard.css` `.sd-topbar`.
 *
 * 변경:
 * - brand pill "OPERATOR"(회색) → "Store" amber-600 + peach-100 bg
 * - 검색창 회색 → peach-200 border + 흰 bg + focus amber-500 ring
 * - 알림 bell ◔ → 🔔 + pulse-pulse-pulse amber-500 badge
 * - 언어 `<select>` → "🌐 한/영" cycling 토글 버튼 (한↔영 1회 클릭)
 * - avatar flat amber-500 → 135deg linear-gradient(amber-500, amber-600)
 * - 사용자 이름 + 로그아웃 텍스트 제거 → avatar 단독 (클릭 시 sign-out)
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
  readonly notificationsAlt: string;
  readonly localeToggleAlt: string;
}

interface Props {
  readonly currentLocale: string;
  readonly locales: readonly LocaleOption[];
  readonly userInitial: string;
  readonly userName: string;
  readonly notificationCount?: number;
  readonly labels: TopBarLabels;
}

/** "🌐 한/영" 토글에 표시할 약어 — 영문 2글자 (KO / EN / JA / VI / ZH). */
const LOCALE_BADGE: Readonly<Record<string, string>> = {
  ko: "한",
  en: "EN",
  ja: "日",
  vi: "VI",
  "zh-CN": "简",
  "zh-TW": "繁",
};

export function TopBar({
  currentLocale,
  locales,
  userInitial,
  userName,
  notificationCount = 0,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const handleLocaleCycle = () => {
    const idx = locales.findIndex((l) => l.code === currentLocale);
    const next = locales[(idx + 1) % locales.length];
    if (next) router.replace(pathname, { locale: next.code as "ko" });
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

  const currentBadge = LOCALE_BADGE[currentLocale] ?? "?";
  const nextLocale =
    locales[
      (locales.findIndex((l) => l.code === currentLocale) + 1) % locales.length
    ];
  const nextBadge = nextLocale ? (LOCALE_BADGE[nextLocale.code] ?? "?") : "—";

  return (
    <header className="row-start-1 col-span-full z-50 flex h-16 items-center gap-6 border-b border-hesya-peach-100 bg-hesya-peach-50/95 px-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)] backdrop-blur-[14px]">
      <div className="flex w-50 flex-shrink-0 items-baseline gap-2 pr-3">
        <span className="font-heading text-[24px] font-semibold italic tracking-[-0.02em] text-hesya-navy-900">
          Hesya
        </span>
        <span className="kr rounded bg-hesya-peach-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-hesya-amber-600">
          {labels.brandPill}
        </span>
      </div>

      <div className="relative mx-2 hidden max-w-xl flex-1 md:block">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
        >
          ⌕
        </span>
        <input
          type="search"
          placeholder={labels.searchPlaceholder}
          className="h-[38px] w-full rounded-md border border-hesya-peach-200 bg-white px-10 text-[13px] text-hesya-navy-900 outline-none transition placeholder:text-gray-400 focus:border-hesya-amber-500 focus:shadow-[0_0_0_3px_rgba(232,169,122,0.18)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-hesya-peach-200 bg-hesya-peach-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 lg:block">
          {labels.searchKbd}
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label={labels.notificationsAlt}
          className="relative grid h-[38px] w-[38px] place-items-center rounded-md border border-transparent bg-transparent text-base transition hover:bg-hesya-peach-100"
        >
          <span aria-hidden="true">🔔</span>
          {notificationCount > 0 ? (
            <span
              data-testid="topbar-notification-badge"
              className="absolute right-0.5 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-hesya-peach-50 bg-[#c9483a] px-1 font-mono text-[9px] font-bold leading-none text-white animate-[pulse_2.4s_ease-in-out_infinite]"
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={handleLocaleCycle}
          aria-label={`${labels.localeToggleAlt}: ${currentBadge} → ${nextBadge}`}
          className="inline-flex h-[38px] items-center gap-1 rounded-md border border-hesya-peach-200 bg-white px-3 text-[13px] font-medium text-hesya-navy-900 transition hover:border-hesya-amber-500"
        >
          <span aria-hidden="true">🌐</span>
          <span className="kr">{currentBadge}</span>
          <span aria-hidden="true" className="mx-0.5 text-gray-400">
            /
          </span>
          <span className="kr text-gray-500">{nextBadge}</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label={`${labels.avatarAlt} (${userName}) — ${labels.signOut}`}
          title={`${userName} — ${labels.signOut}`}
          className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-hesya-amber-500 to-hesya-amber-600 text-[13px] font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
        >
          {userInitial}
        </button>
      </div>
    </header>
  );
}
