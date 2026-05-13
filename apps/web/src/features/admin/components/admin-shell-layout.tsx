import { redirect } from "next/navigation";

import { AdminShell } from "./admin-shell";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { env } from "@/shared/config/env";

/**
 * Plan v3 M6 — admin sub-page 공유 shell layout (server component).
 *
 * dashboard/layout.tsx에서 추출. 9 sub-page에 동일 boilerplate를 9 copies로 두지
 * 않기 위해 헬퍼화. 각 sub-folder의 layout.tsx는 한 줄 re-export로 충분:
 *
 *   export { AdminShellLayout as default } from
 *     "@/features/admin/components/admin-shell-layout";
 *
 * 보안: 가드 실패 → /sign-in. page.tsx의 가드는 그대로 유지 (defense-in-depth).
 */
export async function AdminShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const envLabel = env.VERCEL_ENV ?? "local";
  const envBadge = `${envLabel} · ap-northeast-2`;

  const emailLocal = guard.email.split("@")[0] ?? guard.email;
  const userInitial = (emailLocal[0] ?? "A").toUpperCase();
  const userName = emailLocal;
  const userRole = "OPS";

  return (
    <AdminShell
      currentLocale={locale}
      userName={userName}
      userRole={userRole}
      userInitial={userInitial}
      envBadge={envBadge}
    >
      {children}
    </AdminShell>
  );
}
