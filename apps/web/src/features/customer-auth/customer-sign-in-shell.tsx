"use client";

/**
 * Customer Sign-in Shell (Client) — reference 2-step flow.
 *
 * 출처: docs/design/reference/login-app.jsx
 * - Step 1 (default): Social buttons (Google / Apple mock) + "Use email instead" link
 *   + "or" divider + Passkey mock
 * - Step 2: EmailPasswordForm (floating-label) + "Back to social" link
 *
 * Lang switcher (top-right) — 6 locale routing (next-intl).
 * Apple OAuth / Passkey는 UI mock (PR #194 + 베타 매장 매칭 후 실 backend wire).
 */

import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  EmailPasswordForm,
  type EmailPasswordLabels,
} from "./email-password-form";
import { GoogleOAuthButton } from "./google-oauth-button";

const LOCALES = [
  { code: "en", label: "English", display: "EN" },
  { code: "ja", label: "日本語", display: "JA" },
  { code: "zh-CN", label: "中文 (简体)", display: "ZH" },
  { code: "zh-TW", label: "中文 (繁體)", display: "TW" },
  { code: "vi", label: "Tiếng Việt", display: "VI" },
  { code: "ko", label: "한국어", display: "KO" },
] as const;

export interface CustomerSignInShellLabels {
  wordmarkSub: string;
  wordmarkSubEm: string;
  googleLabel: string;
  googleLoading: string;
  appleLabel: string;
  useEmailInstead: string;
  or: string;
  passkeyLabel: string;
  passkeyReturning: string;
  termsAgree: string;
  termsLabel: string;
  privacyLabel: string;
  complianceText: string;
  footerHelp: string;
  footerTerms: string;
  footerPrivacy: string;
  email: EmailPasswordLabels;
}

interface Props {
  locale: string;
  labels: CustomerSignInShellLabels;
  demoEmail?: string;
  demoPassword?: string;
  /** 데모 hint 노출 시 (NEXT_PUBLIC_DEMO_AUTOFILL=true). */
  demoHint?: string;
}

export function CustomerSignInShell({
  locale,
  labels,
  demoEmail,
  demoPassword,
  demoHint,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [emailMode, setEmailMode] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang =
    LOCALES.find((l) => l.code === locale) ?? LOCALES[LOCALES.length - 1];

  const handleLocaleChange = (code: string) => {
    setLangOpen(false);
    router.replace(pathname, { locale: code as "ko" });
  };

  const handleAppleClick = () => {
    // PR #194 + 베타 매장 매칭 후 실 backend wire 예정.
    // 현재는 UI mock — Google OAuth로 fallback 안내.
    alert(labels.appleLabel + " (mock — use Google or email)");
  };

  const handlePasskeyClick = () => {
    // 베타 후 WebAuthn 구현 예정.
    alert(labels.passkeyLabel + " (mock — use Google or email)");
  };

  return (
    <div className="c-login">
      <div className="c-login-notch" aria-hidden="true" />

      {/* Lang switcher */}
      <div className="c-lang-switcher">
        <button
          type="button"
          className="c-lang-btn"
          onClick={() => setLangOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
        >
          <span aria-hidden="true">🌐</span>
          <span className="c-lang-code">{currentLang.display}</span>
          <span className="c-lang-chev" aria-hidden="true">
            ▾
          </span>
        </button>
        {langOpen && (
          <div className="c-lang-menu" role="listbox">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === locale}
                className={"c-lang-item" + (l.code === locale ? " active" : "")}
                onClick={() => handleLocaleChange(l.code)}
              >
                <span className="c-lc">{l.display}</span>
                <span className="c-ll">{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wordmark */}
      <div className="c-login-top">
        <InkMotifInline />
        <h1 className="c-login-wordmark">Hesya</h1>
        <p className="c-login-sub">
          {labels.wordmarkSub} <em>{labels.wordmarkSubEm}</em>
        </p>
      </div>

      {/* Auth stack */}
      {!emailMode ? (
        <div className="c-auth-stack">
          <GoogleOAuthButton
            locale={locale}
            label={labels.googleLabel}
            loadingLabel={labels.googleLoading}
          />

          <button
            type="button"
            className="c-oauth-btn apple"
            onClick={handleAppleClick}
          >
            <AppleIcon />
            <span>{labels.appleLabel}</span>
          </button>

          <button
            type="button"
            className="c-email-link"
            onClick={() => setEmailMode(true)}
          >
            {labels.useEmailInstead}
          </button>

          <div className="c-login-divider" aria-hidden="true">
            <span className="c-line" />
            <span className="c-or">{labels.or}</span>
            <span className="c-line" />
          </div>

          <button
            type="button"
            className="c-passkey-link"
            onClick={handlePasskeyClick}
          >
            <span className="c-key-emo">🔑</span>
            <span>{labels.passkeyLabel}</span>
            <span className="c-returning">— {labels.passkeyReturning}</span>
          </button>
        </div>
      ) : (
        <>
          <EmailPasswordForm
            locale={locale}
            labels={labels.email}
            onBack={() => setEmailMode(false)}
            demoEmail={demoEmail}
            demoPassword={demoPassword}
          />
          {demoHint && <p className="c-demo-hint">{demoHint}</p>}
        </>
      )}

      {/* Compliance */}
      <p className="c-compliance">
        {labels.termsAgree} <a href="#terms">{labels.termsLabel}</a>{" "}
        {labels.or === "or" ? "and" : "·"}{" "}
        <a href="#privacy">{labels.privacyLabel}</a>.
        <br />
        <span className="c-comply-line">
          <span className="c-badge">GDPR</span>
          <span className="c-badge">K-PIPA</span>
          <span className="c-comply-text">{labels.complianceText}</span>
        </span>
      </p>

      {/* Footer */}
      <div className="c-login-footer">
        <a href="mailto:support@hesya.com">{labels.footerHelp}</a>
        <span className="c-dot">·</span>
        <a href="#terms">{labels.footerTerms}</a>
        <span className="c-dot">·</span>
        <a href="#privacy">{labels.footerPrivacy}</a>
      </div>
    </div>
  );
}

function InkMotifInline() {
  return (
    <svg
      className="c-ink-motif"
      viewBox="0 0 200 120"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M40 30 Q60 20 80 30 Q90 50 70 60 Q50 65 50 80 Q60 95 90 90" />
        <text
          x="105"
          y="80"
          fontSize="60"
          fontFamily="Fraunces, serif"
          fontStyle="italic"
          stroke="none"
          fill="currentColor"
        >
          H
        </text>
        <path d="M85 50 L100 55" strokeDasharray="2 4" />
      </g>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="#FFFFFF"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
