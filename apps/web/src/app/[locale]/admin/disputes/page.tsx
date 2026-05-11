import { redirect } from "next/navigation";
import { createDbClient, type DisputeStatus } from "@hesya/database";
import { env } from "@/shared/config/env";
import { DisputesList } from "@/features/admin";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { listDisputesForAdmin } from "@/shared/lib/dal/disputes";

const VALID_STATUSES: ReadonlyArray<DisputeStatus> = [
  "open",
  "in_review",
  "resolved",
  "rejected",
  "sla_exceeded",
];

function parseStatusFilter(
  raw: string | string[] | undefined,
): DisputeStatus | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (VALID_STATUSES as readonly string[]).includes(v)) {
    return v as DisputeStatus;
  }
  return "all";
}

/**
 * Epic 12.4 — admin 분쟁 큐 (목록).
 *
 * 가드 실패 → /sign-in. status query param으로 필터 (?status=open 등).
 */
export default async function AdminDisputesPage({
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

  const filter = parseStatusFilter(statusParam);
  const db = createDbClient(env.DATABASE_URL);
  const rows = await listDisputesForAdmin(
    db,
    filter === "all" ? {} : { status: filter },
  );

  return (
    <main className="container py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
        분쟁 처리 큐
      </h1>
      {/* server component — Date.now()는 매 요청마다 server-side로 1회 평가 (SLA D-day 표시용). react-hooks/purity는 client render 가정이라 명시 우회. */}
      {/* eslint-disable-next-line react-hooks/purity */}
      <DisputesList rows={rows} activeFilter={filter} nowMs={Date.now()} />
    </main>
  );
}
