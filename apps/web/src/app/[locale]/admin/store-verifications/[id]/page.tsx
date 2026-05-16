import { notFound, redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/shared/config/env";
import { StoreVerificationDetail } from "@/features/admin";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import { getStoreVerificationDetail } from "@/shared/lib/dal/stores";

/**
 * Phase 1-β Task C — admin KYC 검토 상세.
 *
 * 가드 실패 → /sign-in. store 또는 verification 미존재 → notFound.
 * 한 store에 여러 verification 행이 가능하지만 Phase 1-β는 항상 1:1
 * (Task B 트랜잭션이 1건만 INSERT) → DAL이 첫 행 반환.
 */
export default async function StoreVerificationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const guard = await requireAdminRole();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const db = createDbClient(env.DATABASE_URL);
  const detail = await getStoreVerificationDetail(db, id);
  if (!detail) {
    notFound();
  }
  const { store, verification } = detail;

  return (
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Store Verifications · Detail"
        title="매장 검토 상세"
        subtitle={`${store.name} — 사업자 정보 + 법적 선언 확인 후 승인/거절`}
      />
      <div className="mx-auto max-w-4xl px-8 pb-10">
        <StoreVerificationDetail
          storeId={store.id}
          verificationId={verification.id}
          storeName={store.name}
          businessNumber={verification.businessNumber}
          representativeName={verification.representativeName}
          phone={store.phone}
          address={store.address}
          businessLicenseImageUrl={store.businessLicenseImageUrl}
          declarationNoMassage={verification.declarationNoMassage}
          declarationNoMedicalDevice={verification.declarationNoMedicalDevice}
          declarationNoOrientalMedicine={
            verification.declarationNoOrientalMedicine
          }
        />
      </div>
    </div>
  );
}
