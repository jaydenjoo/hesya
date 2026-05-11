import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { env } from "@/shared/config/env";
import { listByStore } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { getStoreBotMode } from "@/shared/lib/dal/stores";
import { UnauthorizedError, ForbiddenError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

import { InboxClient } from "./inbox-client";

/**
 * Phase D4-D2 — Inbox owner page. OwnerShell wrap으로 chrome 일관성 확보.
 *
 * InboxClient 자체는 풀-height 3-column layout (h-[calc(100vh-64px)])이라
 * sidebar 240px와 함께 표시.
 */
export default async function InboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const [conversations, igIntegration, botMode, shell] = await Promise.all([
    listByStore(db, session.storeId),
    getIntegration(db, session.storeId, "instagram"),
    getStoreBotMode(db, session.storeId),
    getOwnerShellData(),
  ]);

  if (!shell) redirect(`/${locale}/sign-in`);

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <InboxClient
        initialConversations={conversations}
        hasIgIntegration={igIntegration !== null}
        igTokenExpiresAt={igIntegration?.tokenExpiresAt ?? null}
        storeId={session.storeId}
        storeBotMode={botMode}
      />
    </OwnerShell>
  );
}
