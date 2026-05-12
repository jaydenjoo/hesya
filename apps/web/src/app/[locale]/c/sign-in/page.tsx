/**
 * Plan v3 M3.4 — customer sign-in 페이지.
 *
 * 외국인 손님 magic link 흐름 진입점. 이메일 입력 → 서버 액션 호출 → 발송 응답
 * 시 /c/sign-in/sent로 redirect. Customer frame (peach 모바일 frame) 일관성.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { SignInForm } from "@/features/customer-auth/sign-in-form";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CustomerSignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CustomerSignIn" });

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

        <SignInForm
          locale={locale}
          labels={{
            emailLabel: t("emailLabel"),
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
