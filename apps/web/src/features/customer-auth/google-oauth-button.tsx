"use client";

/**
 * Customer Google OAuth 버튼 (Client).
 *
 * Better Auth `signIn.social` 호출 → Google consent flow → callback에서
 * `customers` row 자동 upsert (customer-guard 처리). 외국인 손님이 가장 친화적인
 * 1-click 가입/로그인 경로.
 *
 * 디자인: docs/design/reference/login.css `.oauth-btn.google` (56px height, 14px radius).
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
      className="c-oauth-btn google"
      aria-label={label}
    >
      <GoogleIcon />
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41.7 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
