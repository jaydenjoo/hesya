import { redirect } from "next/navigation";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { env } from "@/shared/config/env";

/**
 * Plan v3 M6 — `/admin/dashboard` 전용 shell layout.
 *
 * 다른 `/admin/*` sub-page는 각자 `min-h-screen`을 갖고 있어 admin 폴더 레벨 layout
 * 적용은 layout overflow 충돌. 이번 PR은 dashboard만 reference parity 챔피언으로
 * AdminShell 적용. sub-page 통합 chrome은 후속 PR (각 sub-page에서 min-h-screen
 * 제거하면서 점진 이관).
 *
 * 보안: layout level에서 admin 가드 — `/admin/dashboard` 접근 자체를 막음.
 *       page.tsx의 가드는 그대로 유지 (defense-in-depth).
 */

export default async function AdminDashboardLayout({
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

  // env chip: prod 여부 + region + (선택) build 버전 마커.
  // VERCEL_ENV는 'production' / 'preview' / 'development'.
  const envLabel = env.VERCEL_ENV ?? "local";
  const envBadge = `${envLabel} · ap-northeast-2`;

  // userInitial 첫 글자, userName은 email local-part. (Better Auth 'name' 필드는
  // 신뢰 못 함 — 일부 가입 흐름에서 빈 값 가능.) Role은 운영자 칭호 fallback.
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
