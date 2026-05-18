/**
 * Plan v3 M3.4 — sign-in 발송 완료 confirmation 페이지.
 *
 * /c/sign-in 폼 제출 직후 redirect 대상. email query로 어디로 보냈는지 표시.
 * 손님이 메일 받고 링크 클릭하면 /api/auth/magic-link/verify가 verify 후
 * /{locale}/c/mypage로 redirect (Better Auth plugin 자동 처리).
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function SignInSentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { email } = await searchParams;
  const t = await getTranslations({ locale, namespace: "CustomerSignIn" });
  const displayEmail = email && email.includes("@") ? email : "your email";

  return (
    <CustomerFrame>
      <div className="px-5 pb-8 pt-16 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-hesya-peach-100 text-2xl"
        >
          ✉️
        </div>
        <h1 className="font-heading text-[32px] font-semibold leading-tight tracking-[-0.02em] text-hesya-navy-900">
          {t("sentTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-gray-700">
          {t("sentDescription", { email: displayEmail })}
        </p>
        <p className="mt-6 text-[12px] text-gray-500">{t("securityNote")}</p>
        <Link
          href={`/${locale}`}
          className="mt-10 inline-block text-[13px] text-hesya-amber-600 transition hover:text-hesya-amber-500"
        >
          ← {t("backToHome")}
        </Link>
      </div>
    </CustomerFrame>
  );
}
