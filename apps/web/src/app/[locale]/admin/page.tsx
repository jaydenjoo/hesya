import { redirect } from "next/navigation";

import { requireAdminRole } from "@/shared/lib/admin-role-guard";

/**
 * /[locale]/admin — root redirect.
 * 비로그인/non-admin → /sign-in. admin → /admin/dashboard.
 *
 * 이 page.tsx가 없으면 Next.js App Router는 notFound() 발생 → 404 → 가드 redirect 무효.
 */
export default async function AdminRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guard = await requireAdminRole();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }
  redirect(`/${locale}/admin/dashboard`);
}
