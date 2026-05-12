import { redirect } from "next/navigation";
import {
  API_POLICY_ALERT_STATUSES,
  createDbClient,
  type ApiPolicyAlertStatus,
} from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/shared/config/env";
import { listAlertsForAdmin } from "@/shared/lib/dal/api-policy-alerts";
import { requireAdminEmail } from "@/shared/lib/admin-guard";

/**
 * E12-8 API 정책 변경 알림 — admin 큐 (목록만, status 변경 UI는 후속 PR).
 *
 * n8n RSS 워크플로(tools/n8n/api-policy-rss.workflow.json)가 30분마다 외부
 * RSS를 폴링해 신규 entry를 hesya webhook으로 발송. 본 페이지는 그 큐를 표시.
 *
 * SLA 7일 (PRD §1063).
 */

const STATUS_LABELS: Record<ApiPolicyAlertStatus, string> = {
  new: "신규",
  reviewed: "검토중",
  resolved: "처리 완료",
  ignored: "무시",
};

const STATUS_BADGE_COLORS: Record<ApiPolicyAlertStatus, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-300",
  reviewed: "bg-blue-100 text-blue-900 border-blue-300",
  resolved: "bg-green-100 text-green-900 border-green-300",
  ignored: "bg-gray-100 text-gray-700 border-gray-300",
};

function parseStatusFilter(
  raw: string | string[] | undefined,
): ApiPolicyAlertStatus | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (API_POLICY_ALERT_STATUSES as readonly string[]).includes(v)) {
    return v as ApiPolicyAlertStatus;
  }
  return "all";
}

/**
 * DB의 status text를 안전하게 ApiPolicyAlertStatus 또는 fallback으로 narrow.
 * runtime check 후에만 narrow 단언 — invalid status 발견 시 'new'로 표시.
 */
function narrowStatus(raw: string | null): ApiPolicyAlertStatus {
  if (raw && (API_POLICY_ALERT_STATUSES as readonly string[]).includes(raw)) {
    return raw as ApiPolicyAlertStatus;
  }
  return "new";
}

export default async function AdminApiPolicyAlertsPage({
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
  const rows = await listAlertsForAdmin(
    db,
    filter === "all" ? {} : { status: filter },
  );

  return (
    <main className="min-h-screen bg-hesya-peach-50/30">
      <PageHeader
        eyebrow="Admin · API Policy Alerts"
        title="API 정책 변경 알림"
        subtitle="n8n RSS 워크플로가 30분마다 외부 채널 정책 RSS를 폴링하여 새 entry 발견 시 자동 등록. SLA 7일 (PRD §1063 R1)."
      />
      <div className="container py-8">
        <div className="mb-6">
          <FilterTabs
            activeFilter={filter}
            basePath={`/${locale}/admin/api-policy-alerts`}
          />
        </div>

        {rows.length === 0 ? (
          <section className="rounded-md border border-dashed border-hesya-peach-200 bg-hesya-peach-50/60 p-8 text-center">
            <p className="text-sm text-hesya-navy-900/70">
              {filter === "all"
                ? "API 정책 변경 알림 없음 — n8n RSS 워크플로 가동 후 자동 수집됩니다."
                : `'${STATUS_LABELS[filter]}' 상태 알림 없음.`}
            </p>
            <p className="mt-2 text-xs text-hesya-navy-900/60">
              워크플로 import 가이드:{" "}
              <code className="font-mono">tools/n8n/README.md</code>
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-md border border-hesya-peach-100">
            <table className="w-full text-sm">
              <thead className="bg-hesya-peach-50/60 text-xs font-medium text-hesya-navy-900/70">
                <tr>
                  <th className="px-4 py-2 text-left">상태</th>
                  <th className="px-4 py-2 text-left">출처</th>
                  <th className="px-4 py-2 text-left">제목</th>
                  <th className="px-4 py-2 text-left">발행일</th>
                  <th className="px-4 py-2 text-left">수신일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hesya-peach-100">
                {rows.map((alert) => {
                  const statusKey = narrowStatus(alert.status);
                  return (
                    <tr
                      key={alert.id}
                      className="transition-colors hover:bg-hesya-peach-50/40"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[statusKey]}`}
                        >
                          {STATUS_LABELS[statusKey]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-hesya-navy-900/80">
                        {alert.source}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-hesya-amber-500 hover:underline"
                        >
                          {alert.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-hesya-navy-900/60">
                        {alert.pubDate
                          ? new Date(alert.pubDate).toISOString().slice(0, 10)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-hesya-navy-900/60">
                        {new Date(alert.receivedAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}

function FilterTabs({
  activeFilter,
  basePath,
}: {
  activeFilter: ApiPolicyAlertStatus | "all";
  basePath: string;
}) {
  const tabs: Array<{ key: ApiPolicyAlertStatus | "all"; label: string }> = [
    { key: "all", label: "전체" },
    { key: "new", label: "신규" },
    { key: "reviewed", label: "검토중" },
    { key: "resolved", label: "처리 완료" },
    { key: "ignored", label: "무시" },
  ];

  return (
    <nav className="flex gap-2 text-xs">
      {tabs.map((tab) => {
        const href =
          tab.key === "all" ? basePath : `${basePath}?status=${tab.key}`;
        const isActive = activeFilter === tab.key;
        return (
          <a
            key={tab.key}
            href={href}
            className={`rounded-md border px-3 py-1 transition-colors ${
              isActive
                ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                : "border-gray-200 bg-white text-hesya-navy-900 hover:border-hesya-navy-900"
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
