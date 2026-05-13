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
  new: "bg-[#fbeae5] text-[#c9483a]",
  reviewed: "bg-hesya-peach-100 text-hesya-amber-600",
  resolved: "bg-emerald-50 text-emerald-700",
  ignored: "bg-gray-100 text-gray-600",
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
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · API Policy Alerts"
        title="API 정책 변경 알림"
        subtitle="n8n RSS 워크플로가 30분마다 외부 채널 정책 RSS를 폴링하여 새 entry 발견 시 자동 등록. SLA 7일 (PRD §1063 R1)."
      />
      <div className="mx-auto max-w-6xl px-8 pb-10">
        <div className="mb-5">
          <FilterTabs
            activeFilter={filter}
            basePath={`/${locale}/admin/api-policy-alerts`}
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
            >
              ✨
            </div>
            <p className="kr text-[13px] text-gray-500">
              {filter === "all"
                ? "API 정책 변경 알림 없음 — n8n RSS 워크플로 가동 후 자동 수집됩니다."
                : `'${STATUS_LABELS[filter]}' 상태 알림 없음.`}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              워크플로 import 가이드:{" "}
              <code className="font-mono">tools/n8n/README.md</code>
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-hesya-peach-100 bg-white">
            <table className="w-full text-[13px]">
              <thead className="bg-hesya-peach-50">
                <tr className="text-left">
                  <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                    상태
                  </th>
                  <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                    출처
                  </th>
                  <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                    제목
                  </th>
                  <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                    발행일
                  </th>
                  <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                    수신일
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((alert) => {
                  const statusKey = narrowStatus(alert.status);
                  return (
                    <tr
                      key={alert.id}
                      className="border-t border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={
                            "kr inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                            STATUS_BADGE_COLORS[statusKey]
                          }
                        >
                          {STATUS_LABELS[statusKey]}
                        </span>
                      </td>
                      <td className="mono px-4 py-3 text-gray-700">
                        {alert.source}
                      </td>
                      <td className="kr px-4 py-3">
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-hesya-amber-600 hover:underline"
                        >
                          {alert.title}
                        </a>
                      </td>
                      <td className="mono px-4 py-3 text-gray-700">
                        {alert.pubDate
                          ? new Date(alert.pubDate).toISOString().slice(0, 10)
                          : "—"}
                      </td>
                      <td className="mono px-4 py-3 text-gray-700">
                        {new Date(alert.receivedAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href =
          tab.key === "all" ? basePath : `${basePath}?status=${tab.key}`;
        const isActive = activeFilter === tab.key;
        return (
          <a
            key={tab.key}
            href={href}
            className={
              "kr rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors " +
              (isActive
                ? "border-hesya-amber-500 bg-white text-hesya-navy-900"
                : "border-hesya-peach-200 bg-white/50 text-gray-700 hover:bg-white")
            }
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
