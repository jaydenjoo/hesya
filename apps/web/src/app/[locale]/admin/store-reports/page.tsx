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

import { PageHeader } from "@/components/ui/page-header";
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
    <div className="min-h-full bg-hesya-peach-50">
      <PageHeader
        eyebrow="Admin · Store Reports"
        title="외부 신고 접수"
        subtitle="Epic 9 § 11 — 고객·경쟁사가 매장의 의료법 위반·위생·사기 등을 제보. 접수만 진행 (admin 처리는 Epic 12에서). Phase 1 admin 검증용 — 공개 폼은 Phase 1.5 reCAPTCHA 도입 후 분리."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-8 pb-10">
        <ReportSection />
      </div>
    </div>
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
      <div className="rounded-2xl border border-hesya-peach-200 bg-white p-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
        <p className="mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §01 · New Report
        </p>
        <h2 className="mb-4 font-display text-[20px] italic tracking-tight text-hesya-navy-900">
          신규 신고 접수
        </h2>
        <ol
          aria-label="신고 처리 절차"
          className="mb-5 grid grid-cols-1 gap-2 rounded-2xl bg-hesya-peach-50/60 px-4 py-3 sm:grid-cols-3"
        >
          {["1. 접수 (현재)", "2. admin 검토 (Epic 12)", "3. 매장 통보"].map(
            (step, i) => (
              <li
                key={step}
                className="flex items-center gap-1.5 font-mono text-[10.5px]"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${i === 0 ? "bg-hesya-amber-500 ring-4 ring-hesya-amber-500/20" : "bg-hesya-navy-900/15"}`}
                />
                <span
                  className={
                    i === 0
                      ? "font-semibold text-hesya-amber-600"
                      : "text-hesya-navy-900/55"
                  }
                >
                  {step}
                </span>
              </li>
            ),
          )}
        </ol>
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
            className="kr inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "접수 중..." : "신고 접수"}
            {isPending ? null : <span aria-hidden="true">→</span>}
          </button>
        </form>
      </div>
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
    <label className="block space-y-1.5">
      <span className="kr block font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultBlock({ result }: { result: SubmitStoreReportActionResult }) {
  if (result.ok) {
    return (
      <section className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-5 ring-1 ring-inset ring-emerald-100 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[14px] font-bold text-white"
          >
            ✓
          </span>
          <div className="space-y-0.5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              §02 · Submitted
            </p>
            <h2 className="font-display text-[18px] italic text-hesya-navy-900">
              신고 접수 완료
            </h2>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-emerald-100 bg-emerald-100 text-[12.5px] sm:grid-cols-3">
          <ResultCell k="report ID" v={result.reportId} />
          <ResultCell k="store ID" v={result.storeId} />
          <ResultCell k="status" v="pending · Epic 12 queue" />
        </dl>
      </section>
    );
  }
  return (
    <section className="space-y-2 rounded-2xl border border-hesya-danger-200 bg-white p-5 ring-1 ring-inset ring-hesya-danger-100 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-hesya-danger-600 text-[14px] font-bold text-white"
        >
          ⚠
        </span>
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-danger-600">
            §02 · Failed
          </p>
          <h2 className="font-display text-[17px] italic text-hesya-navy-900">
            실패: {result.error}
          </h2>
        </div>
      </div>
      <p className="whitespace-pre-wrap rounded-md border border-hesya-danger-200 bg-hesya-danger-100/60 px-3 py-2 text-[12.5px] text-hesya-navy-900/80">
        {result.message}
      </p>
    </section>
  );
}

function ResultCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-white px-3 py-2">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
        {k}
      </dt>
      <dd className="break-all font-mono text-[12px] text-hesya-navy-900">
        {v}
      </dd>
    </div>
  );
}
