/**
 * E9-11 외부 신고 접수 검증용 페이지 (Phase 1 admin only).
 *
 * 향후 Epic 12 admin panel에 흡수. 공개 폼(외부인 신고)은 Phase 1.5 reCAPTCHA
 * 도입 후 매장 페이지에서 link로 분리.
 *
 * 디자인은 minimal — Phase 1 검증 우선.
 */
"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  REPORTER_TYPES,
  REPORT_REASONS,
  type ReporterType,
  type ReportReason,
} from "@hesya/shared-types";
import {
  submitStoreReportAction,
  type SubmitStoreReportActionResult,
} from "@/lib/store-reports/actions";

const REPORTER_LABELS: Record<ReporterType, string> = {
  customer: "고객",
  competitor: "경쟁사",
  staff: "전직 직원",
  anonymous: "익명",
};

const REASON_LABELS: Record<ReportReason, string> = {
  illegal_service: "불법 시술 (마사지·의료기기·한방)",
  safety_issue: "위생·안전 문제",
  fraud: "사기·허위 광고",
  other: "기타",
};

export default function StoreReportPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
          외부 신고 접수
        </h1>
        <p className="text-sm leading-relaxed text-hesya-navy-900/70">
          Epic 9 § 11 — 고객·경쟁사가 매장의 의료법 위반·위생·사기 등을 제보.
          접수만 진행 (admin 처리는 Epic 12에서). Phase 1 admin 검증용 — 공개
          폼은 Phase 1.5 reCAPTCHA 도입 후 분리.
        </p>
      </header>
      <ReportSection />
    </main>
  );
}

function ReportSection() {
  const [storeId, setStoreId] = useState("");
  const [reporterType, setReporterType] = useState<ReporterType>("customer");
  const [reportReason, setReportReason] =
    useState<ReportReason>("illegal_service");
  const [description, setDescription] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [result, setResult] = useState<SubmitStoreReportActionResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    const evidenceUrls = evidenceText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      const res = await submitStoreReportAction({
        storeId: storeId.trim(),
        reporterType,
        reportReason,
        description: description.trim(),
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });
      setResult(res);
    });
  };

  return (
    <section className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="매장 ID (UUID)">
          <input
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="예: 0c1d2e3f-..."
            required
            className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 font-mono text-sm focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          />
        </Field>
        <Field label="신고자 유형">
          <select
            value={reporterType}
            onChange={(e) => setReporterType(e.target.value as ReporterType)}
            className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          >
            {REPORTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {REPORTER_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="신고 사유">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value as ReportReason)}
            className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="신고 내용 (10자 이상, 2000자 이내)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="구체적 일시·시술명·근거를 명확히 기재"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          />
          <span className="text-xs text-hesya-navy-900/60">
            {description.length} / 2000자
          </span>
        </Field>
        <Field label="증거 URL (선택, 줄바꿈으로 구분, 최대 5개)">
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="https://example.com/photo1.jpg
https://example.com/screenshot.png"
            rows={3}
            className="w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 font-mono text-xs focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          />
        </Field>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "접수 중..." : "신고 접수"}
        </button>
      </form>
      {result && <ResultBlock result={result} />}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-hesya-navy-900">
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultBlock({ result }: { result: SubmitStoreReportActionResult }) {
  if (result.ok) {
    return (
      <section className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="font-semibold text-emerald-900">신고 접수 완료</h2>
        <dl className="space-y-1 text-sm">
          <Row k="report ID" v={result.reportId} />
          <Row k="store ID" v={result.storeId} />
          <Row k="status" v="pending (Epic 12 admin queue 대기)" />
        </dl>
      </section>
    );
  }
  return (
    <section className="space-y-2 rounded-md border border-red-200 bg-red-50 p-4">
      <h2 className="font-semibold text-red-900">실패: {result.error}</h2>
      <p className="text-sm whitespace-pre-wrap">{result.message}</p>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 font-medium text-hesya-navy-900">{k}</dt>
      <dd className="break-all font-mono">{v}</dd>
    </div>
  );
}
