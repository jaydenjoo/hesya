import { redirect } from "next/navigation";
import {
  API_POLICY_ALERT_STATUSES,
  createDbClient,
  type ApiPolicyAlertStatus,
} from "@hesya/database";

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
    <main className="container py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">API 정책 변경 알림</h1>
        <p className="text-sm text-gray-600">
          n8n RSS 워크플로가 30분마다 외부 채널 정책 RSS를 폴링하여 새 entry
          발견 시 자동 등록. SLA 7일 (PRD §1063 R1).
        </p>
        <FilterTabs
          activeFilter={filter}
          basePath={`/${locale}/admin/api-policy-alerts`}
        />
      </header>

      {rows.length === 0 ? (
        <section className="rounded border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            {filter === "all"
              ? "API 정책 변경 알림 없음 — n8n RSS 워크플로 가동 후 자동 수집됩니다."
              : `'${STATUS_LABELS[filter]}' 상태 알림 없음.`}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            워크플로 import 가이드:{" "}
            <code className="font-mono">tools/n8n/README.md</code>
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">상태</th>
                <th className="px-4 py-2 text-left">출처</th>
                <th className="px-4 py-2 text-left">제목</th>
                <th className="px-4 py-2 text-left">발행일</th>
                <th className="px-4 py-2 text-left">수신일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((alert) => {
                const statusKey = alert.status as ApiPolicyAlertStatus;
                return (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[statusKey] ?? STATUS_BADGE_COLORS.new}`}
                      >
                        {STATUS_LABELS[statusKey] ?? alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {alert.source}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={alert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline hover:text-blue-900"
                      >
                        {alert.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {alert.pubDate
                        ? new Date(alert.pubDate).toISOString().slice(0, 10)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(alert.receivedAt).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
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
            className={`rounded border px-3 py-1 ${
              isActive
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
