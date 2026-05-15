"use client";

/**
 * Customer Google OAuth 버튼 (Client).
 *
 * Better Auth `signIn.social` 호출 → Google consent flow → callback에서
 * `customers` row 자동 upsert (customer-guard 처리). 외국인 손님이 가장 친화적인
 * 1-click 가입/로그인 경로.
 */

import { useState } from "react";
import { createAuthClient } from "@hesya/auth/client";

const authClient = createAuthClient();

interface Props {
  locale: string;
  label: string;
  loadingLabel: string;
}

export function GoogleOAuthButton({ locale, label, loadingLabel }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `/${locale}/c/mypage`,
      });
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-hesya-navy-900/15 bg-white px-6 py-3 text-[14px] font-medium text-hesya-navy-900 transition hover:border-hesya-navy-900/30 disabled:opacity-60"
      aria-label={label}
    >
      <GoogleIcon />
      {loading ? loadingLabel : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
