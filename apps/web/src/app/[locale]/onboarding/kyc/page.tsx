import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { KycForm, submitKycApplication } from "@/features/onboarding";

/**
 * Phase 1-β Task B — owner KYC 신청 폼 페이지 (O1).
 *
 * 미인증이면 sign-in으로 redirect. 폼 제출은 inline server action으로
 * submitKycApplication 호출 → 성공 시 /onboarding/pending로 redirect.
 */
export default async function KycPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  async function onSubmit(input: unknown) {
    "use server";
    const result = await submitKycApplication(input);
    if (result.ok) {
      redirect(`/${locale}/onboarding/pending`);
    }
    // Phase 1-β 단순화: 폼 단의 disable + zod 사전 차단으로 대부분 케이스
    // 차단됨. 그래도 도달하면 throw → Next.js error.tsx 표시.
    throw new Error(result.message);
  }

  return (
    <main
      data-testid="kyc-submit-page"
      className="min-h-screen bg-hesya-peach-50 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto max-w-xl">
        <header className="mb-6 space-y-1.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Onboarding · KYC
          </p>
          <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
            매장 등록
          </h1>
          <p className="kr text-[13px] text-gray-600">
            영업신고증 정보를 확인 후 24~48시간 내 검토 결과를 안내드립니다.
          </p>
        </header>
        <div className="rounded-2xl border border-hesya-peach-100 bg-white p-5 shadow-sm sm:p-7">
          <KycForm onSubmit={onSubmit} />
        </div>
      </div>
    </main>
  );
}
