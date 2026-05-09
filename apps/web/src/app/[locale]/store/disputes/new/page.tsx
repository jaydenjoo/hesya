import { redirect } from "next/navigation";
import { DisputeForm } from "@/features/disputes";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 12.4 — 사장 측 분쟁 신규 신고 페이지.
 *
 * 가드 실패 → /sign-in. 폼 자체는 client component(`DisputeForm`).
 */
export default async function NewDisputePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  try {
    await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">분쟁 신고</h1>
      <DisputeForm />
    </main>
  );
}
