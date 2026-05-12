import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { env } from "@/shared/config/env";
import { listSkippedMessagesByStore } from "@/shared/lib/dal/messages";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v3 M4.2 — 매장 owner가 "건너뛰기" 처리한 AI 초안 목록 (read-only).
 *
 * 의도적 skip이 대다수이므로 복구 액션 없이 누락 검토용 list view만 제공.
 */
export default async function InboxSkippedPage({
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
  const [rows, shell] = await Promise.all([
    listSkippedMessagesByStore(db, session.storeId),
    getOwnerShellData(),
  ]);
  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: "InboxSkipped" });

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="bg-hesya-peach-50">
        <PageHeader
          eyebrow="Operator · Inbox · Skipped"
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mx-auto max-w-4xl px-8 pb-10">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
              >
                ✨
              </div>
              <p className="kr text-[13px] text-gray-500">{t("emptyText")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-hesya-peach-100 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-amber-600">
                      {m.channel}
                    </span>
                    <time className="font-mono text-[11px] text-gray-500">
                      {m.createdAt ? dateFormatter.format(m.createdAt) : ""}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-hesya-navy-900/85">
                    {m.originalText}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}
