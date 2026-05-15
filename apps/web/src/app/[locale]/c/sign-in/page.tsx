/**
 * Plan v3 M3.4 + 세션 34 옵션 B — customer sign-in 페이지.
 *
 * 외국인 손님 인증 진입점. 3 경로:
 *   1. Primary: Email + Password 즉시 로그인 (`EmailPasswordForm`) — Better Auth signIn.email
 *   2. Secondary: Google OAuth 1-click (`GoogleOAuthButton`) — `customers` row 자동 upsert (customer-guard)
 *   3. Tertiary: Magic Link (기존 `SignInForm`) — 비번 모를 시 또는 신규 이메일 등록
 *
 * Customer frame (peach 모바일 frame) 일관성.
 * Demo 모드: `NEXT_PUBLIC_DEMO_AUTOFILL === "true"`면 demo-customer@hesya.com /
 * Hesya!DemoCustomer2026 자동 prefill (외부 시연 baseline 충족).
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { EmailPasswordForm } from "@/features/customer-auth/email-password-form";
import { GoogleOAuthButton } from "@/features/customer-auth/google-oauth-button";
import { SignInForm } from "@/features/customer-auth/sign-in-form";

const DEMO_EMAIL = "demo-customer@hesya.com";
const DEMO_PASSWORD = "Hesya!DemoCustomer2026";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CustomerSignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CustomerSignIn" });

  const demoMode = process.env.NEXT_PUBLIC_DEMO_AUTOFILL === "true";

  return (
    <CustomerFrame>
      <div className="px-5 pb-8 pt-6">
        <header className="mb-6 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-[28px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {t("title")}
          </h1>
          <p className="text-[13px] leading-relaxed text-hesya-navy-900/65">
            {t("subtitle")}
          </p>
        </header>

        <EmailPasswordForm
          locale={locale}
          labels={{
            emailLabel: t("emailLabel"),
            emailPlaceholder: t("emailPlaceholder"),
            passwordLabel: t("passwordLabel"),
            passwordPlaceholder: t("passwordPlaceholder"),
            submit: t("passwordSubmit"),
            signingIn: t("signingIn"),
            errorInvalidCredentials: t("errorInvalidCredentials"),
            errorInvalidEmail: t("errorInvalidEmail"),
          }}
          demoEmail={demoMode ? DEMO_EMAIL : undefined}
          demoPassword={demoMode ? DEMO_PASSWORD : undefined}
        />

        {demoMode && (
          <p className="mt-2 rounded-xl bg-hesya-amber-50 px-3 py-2 text-[11px] leading-relaxed text-hesya-navy-900/70">
            🧪 {t("demoHint", { email: DEMO_EMAIL, password: DEMO_PASSWORD })}
          </p>
        )}

        <div
          className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-hesya-navy-900/40"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-hesya-navy-900/15" />
          <span>{t("or")}</span>
          <span className="h-px flex-1 bg-hesya-navy-900/15" />
        </div>

        <GoogleOAuthButton
          locale={locale}
          label={t("googleLabel")}
          loadingLabel={t("googleLoading")}
        />

        <div
          className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-hesya-navy-900/40"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-hesya-navy-900/15" />
          <span>{t("magicLinkDivider")}</span>
          <span className="h-px flex-1 bg-hesya-navy-900/15" />
        </div>

        <SignInForm
          locale={locale}
          labels={{
            emailLabel: t("magicLinkEmailLabel"),
            emailPlaceholder: t("emailPlaceholder"),
            submit: t("submit"),
            sending: t("sending"),
            errorInvalidEmail: t("errorInvalidEmail"),
            securityNote: t("securityNote"),
          }}
        />
      </div>
    </CustomerFrame>
  );
}
