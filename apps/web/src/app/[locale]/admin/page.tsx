import { redirect } from "next/navigation";

/**
 * /[locale]/admin — root redirect to /admin/dashboard.
 *
 * 가드는 admin-shell-layout이 이미 처리 (requireAdminRole 실패 → /sign-in).
 * 여기서 또 가드를 호출하면 layout + page 이중 redirect()로 RSC stream이 깨져
 * "Application error: a client-side exception" 발생. 가드 중복 제거 + redirect만.
 */
export default async function AdminRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/dashboard`);
}
