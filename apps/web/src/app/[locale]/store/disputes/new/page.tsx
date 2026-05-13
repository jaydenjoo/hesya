import { redirect } from "next/navigation";

import { DisputeForm } from "@/features/disputes";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 12.4 / Phase D4-D4 — 사장 측 분쟁 신규 신고 페이지.
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Operator · Disputes · New
        </p>
        <h1 className="font-heading text-3xl font-semibold italic tracking-tight text-hesya-navy-900">
          분쟁 신고
        </h1>
        <p className="text-sm text-hesya-navy-900/65">
          손님과의 분쟁을 신고하면 운영팀이 24시간 내 검토합니다.
        </p>
      </header>
      <DisputeForm />
    </div>
  );
}
