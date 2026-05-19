import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/shared/lib/admin-role-guard";

import { ReportDetailView } from "./ReportDetailView";
import "./report-detail.css";

/**
 * /[locale]/admin/store-reports/[id] — 매장 신고 상세 + 조치 결정.
 * Reference: docs/design/reference/Hesya Admin Store Reports Detail.html
 *
 * 베타: mock 신고 3건 + 조치 결정 (A~F) + 확정 modal. in-memory.
 * 추후 store_reports + admin_actions DAL 도입 시 server-side.
 */

export const metadata: Metadata = {
  title: "매장 신고 상세 · Hesya Admin",
  description: "매장 신고 이력과 조치 결정.",
  robots: { index: false, follow: false },
};

export default async function StoreReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const guard = await requireAdminRole();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }
  return <ReportDetailView id={id} />;
}
