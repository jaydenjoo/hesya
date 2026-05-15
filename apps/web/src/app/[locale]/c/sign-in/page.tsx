/**
 * Customer Sign-in 페이지 — reference 디자인 (Phase 2 fast track #2, 정밀 45% → 100%).
 *
 * 출처: docs/design/reference/login-app.jsx + login.css
 * 구조:
 *   1. Wordmark + ink-motif SVG + 태그라인 (브랜드 시그너처)
 *   2. 2-step flow — Step 1 (social first: Google + Apple mock + Passkey mock + "Use email instead")
 *      / Step 2 (email + password form + back link)
 *   3. Lang switcher 6 locale dropdown (top-right)
 *   4. Compliance + GDPR/K-PIPA badges + footer
 *
 * Demo: `NEXT_PUBLIC_DEMO_AUTOFILL=true`이면 step 2에 demo-customer 자동 prefill +
 * hint 표기 (외부 시연 baseline).
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { CustomerSignInShell } from "@/features/customer-auth/customer-sign-in-shell";
import "./c-login.css";

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
      <CustomerSignInShell
        locale={locale}
        labels={{
          wordmarkSub: t("wordmarkSub"),
          wordmarkSubEm: t("wordmarkSubEm"),
          googleLabel: t("googleLabel"),
          googleLoading: t("googleLoading"),
          appleLabel: t("appleLabel"),
          useEmailInstead: t("useEmailInstead"),
          or: t("or"),
          passkeyLabel: t("passkeyLabel"),
          passkeyReturning: t("passkeyReturning"),
          termsAgree: t("termsAgree"),
          termsLabel: t("termsLabel"),
          privacyLabel: t("privacyLabel"),
          complianceText: t("complianceText"),
          footerHelp: t("footerHelp"),
          footerTerms: t("footerTerms"),
          footerPrivacy: t("footerPrivacy"),
          email: {
            emailLabel: t("emailLabel"),
            emailPlaceholder: t("emailPlaceholder"),
            passwordLabel: t("passwordLabel"),
            passwordPlaceholder: t("passwordPlaceholder"),
            submit: t("passwordSubmit"),
            signingIn: t("signingIn"),
            errorInvalidCredentials: t("errorInvalidCredentials"),
            errorInvalidEmail: t("errorInvalidEmail"),
            emailHint: t("emailHint"),
            backLabel: t("backToSocial"),
          },
        }}
        demoEmail={demoMode ? DEMO_EMAIL : undefined}
        demoPassword={demoMode ? DEMO_PASSWORD : undefined}
        demoHint={
          demoMode
            ? t("demoHint", { email: DEMO_EMAIL, password: DEMO_PASSWORD })
            : undefined
        }
      />
    </CustomerFrame>
  );
}
