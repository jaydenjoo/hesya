import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import { listByStore } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { getStoreBotMode } from "@/shared/lib/dal/stores";
import { UnauthorizedError, ForbiddenError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

import { InboxClient } from "./inbox-client";

/**
 * Phase D4-D2 — Inbox owner page. InboxClient 자체가 풀-height 3-column layout
 * (h-[calc(100vh-64px)])이라 layout의 sidebar 240px와 함께 표시.
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
  const [conversations, igIntegration, botMode] = await Promise.all([
    listByStore(db, session.storeId),
    getIntegration(db, session.storeId, "instagram"),
    getStoreBotMode(db, session.storeId),
  ]);

  return (
    <InboxClient
      initialConversations={conversations}
      hasIgIntegration={igIntegration !== null}
      igTokenExpiresAt={igIntegration?.tokenExpiresAt ?? null}
      storeId={session.storeId}
      storeBotMode={botMode}
    />
  );
}
