import { redirect } from "next/navigation";

import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { AdminDeletionQueue } from "@/features/store-deletion";
import { env } from "@/shared/config/env";
import { listDeletionRequestsForAdmin } from "@/shared/lib/dal/store-deletion";
import { requireAdminEmail } from "@/shared/lib/admin-guard";

/**
 * E12-9 — admin 매장 해지 큐 (PRD §1068, SLA 30일).
 *
 * 큐 4종 + 강제해지 폼. cron(/api/cron/cascade-delete-expired-stores)이 매일
 * scheduled_purge_at 경과 행을 cascade hard-delete.
 */
type Filter = "pending" | "expired" | "cancelled" | "purged" | "all";

const VALID_FILTERS: readonly Filter[] = [
  "pending",
  "expired",
  "cancelled",
  "purged",
  "all",
] as const;

function parseFilter(raw: string | string[] | undefined): Filter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (VALID_FILTERS as readonly string[]).includes(v)) {
    return v as Filter;
  }
  return "pending";
}

function narrowSource(raw: string): "owner" | "admin" | string {
  return raw === "owner" || raw === "admin" ? raw : raw;
}

export default async function AdminStoreDeletionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { locale } = await params;
  const { status: statusParam } = await searchParams;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const filter = parseFilter(statusParam);
  const db = createDbClient(env.DATABASE_URL);
  const rows = await listDeletionRequestsForAdmin(db, { status: filter });

  return (
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Store Deletion"
        title="매장 해지 / 데이터 삭제"
        subtitle="개인정보보호법 §21 — 보유기간 경과 후 30일 grace 후 cascade 영구 삭제."
      />
      <div className="mx-auto max-w-6xl px-8 pb-10">
        <AdminDeletionQueue
          rows={rows.map((r) => ({
            id: r.id,
            storeId: r.storeId,
            storeName: r.storeName,
            source: narrowSource(r.source),
            requestedByEmail: r.requestedByEmail,
            reason: r.reason,
            scheduledPurgeAt: r.scheduledPurgeAt.toISOString(),
            cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
            cancelledByEmail: r.cancelledByEmail,
            purgedAt: r.purgedAt ? r.purgedAt.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
          }))}
          filter={filter}
          /* eslint-disable-next-line react-hooks/purity */
          nowMs={Date.now()}
          locale={locale}
        />
      </div>
    </div>
  );
}
