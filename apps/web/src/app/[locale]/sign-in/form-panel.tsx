"use client";

import { useState } from "react";
import { createAuthClient } from "@hesya/auth/client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { OwnerSignInForm } from "@/features/store-auth/sign-in-form";

const authClient = createAuthClient();

interface LocaleOption {
  readonly code: string;
  readonly label: string;
}

interface FormPanelProps {
  callbackUrl: string;
  currentLocale: string;
  locales: readonly LocaleOption[];
}

export function FormPanel({
  callbackUrl,
  currentLocale,
  locales,
}: FormPanelProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch {
      setLoading(false);
    }
  };

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    // next-intl 타입은 locale을 union으로 enforce — 6 locale 화이트리스트 안에서만
    // 선택 가능하므로 cast 안전.
    router.replace(pathname, { locale: newLocale as "ko" });
  };

  return (
    <main className="sl-form">
      <div className="sl-form-top">
        <label className="sl-lang-chip" aria-label="언어 선택">
          <span aria-hidden="true">🌐</span>
          <select
            value={currentLocale}
            onChange={handleLocaleChange}
            className="sl-lang-select"
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sl-form-stack">
        <div className="sl-h-eyebrow">
          <span>Sign in</span>
          <span className="sl-h-eyebrow-line" />
        </div>
        <h1 className="sl-h-title">
          매장 <em>로그인</em>
        </h1>
        <p className="sl-h-body">
          매장 매니저 계정으로 로그인하세요. 처음이라면 사업자등록번호로 가입을
          시작할 수 있습니다.
        </p>

        <OwnerSignInForm
          locale={currentLocale}
          callbackUrl={callbackUrl}
          demoEmail={
            process.env.NEXT_PUBLIC_DEMO_AUTOFILL === "true"
              ? "demo@hesya.com"
              : undefined
          }
          demoPassword={
            process.env.NEXT_PUBLIC_DEMO_AUTOFILL === "true"
              ? "Hesya!Demo2026"
              : undefined
          }
        />

        {process.env.NEXT_PUBLIC_DEMO_AUTOFILL === "true" && (
          <p className="sl-demo-hint">
            🧪 데모 자격증명 자동 입력됨: <strong>demo@hesya.com</strong> /{" "}
            <strong>Hesya!Demo2026</strong>
          </p>
        )}

        <div className="sl-divider" aria-hidden="true">
          <span className="sl-divider-line" />
          <span className="sl-divider-or">또는</span>
          <span className="sl-divider-line" />
        </div>

        <button
          type="button"
          className="sl-btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg
            className="sl-btn-google-icon"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.32z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          <span>{loading ? "로그인 중..." : "Google로 로그인"}</span>
        </button>

        <div className="sl-thin-divider" />

        <Link href="/onboarding/kyc" className="sl-signup">
          <div className="sl-signup-body">
            <span className="sl-signup-eyebrow">New here</span>
            <span className="sl-signup-text">처음이신가요? 무료 매장 가입</span>
          </div>
          <span className="sl-signup-arrow">→</span>
        </Link>
      </div>

      <div className="sl-trust">
        <div className="sl-trust-row">
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🔒</span>
            <span>256-bit SSL</span>
          </div>
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🇰🇷</span>
            <span>한국 내 서버</span>
          </div>
          <div className="sl-trust-badge">
            <span className="sl-trust-icon">🛡</span>
            <span>개인정보 보호 인증</span>
          </div>
        </div>
        <div className="sl-trust-meta">
          <span>도움이 필요하신가요?</span>
          <a href="mailto:support@hesya.com" className="sl-trust-help">
            매장 지원팀 →
          </a>
        </div>
      </div>
    </main>
  );
}
