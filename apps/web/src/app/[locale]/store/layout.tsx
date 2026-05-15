import { redirect } from "next/navigation";

import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";

/**
 * Owner Shell layout — `/store/*` 모든 페이지의 chrome(top bar + sidebar) 공유.
 *
 * Next.js App Router에서 layout은 자식 페이지 간 navigation 시 unmount되지 않고
 * persist된다. 페이지 단위로 `<OwnerShell>` wrap을 풀어 매 클릭마다 sidebar/top-bar
 * 재마운트 + 가드/shell 데이터 중복 fetch가 사라진다.
 *
 * `getOwnerShellData`는 `React.cache()` wrap — layout이 호출하고 페이지가 다시
 * 호출해도 1회만 실행된다 (storeName이 필요한 페이지는 그대로 호출 가능).
 */
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const shell = await getOwnerShellData();

  if (!shell) redirect(`/${locale}/sign-in`);

  // Reference 정합 PR 5/6 — bell badge mock (3) + Inbox sidebar badge mock (12).
  // 실 데이터: notifications 테이블 / getInboxLoad DAL (별도 task).
  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
      notificationCount={3}
      navCounts={{ inbox: { count: 12 } }}
    >
      {children}
    </OwnerShell>
  );
}
