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
    <main className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">매장 등록</h1>
      <KycForm onSubmit={onSubmit} />
    </main>
  );
}
