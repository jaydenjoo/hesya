"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { DisputeCategory } from "@hesya/database";

import {
  submitDisputeAction,
  type SubmitDisputeResult,
} from "@/lib/disputes/actions";

/**
 * Epic 12.4 — 사장 측 분쟁 신고 폼.
 *
 * store-reports/page.tsx 패턴 재사용 (`useTransition` + Server Action).
 * 디자인 minimal — Phase 1-ε에서 일괄 정합성 적용.
 */
const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  no_show: "노쇼 (예약 후 미방문)",
  refund: "환불 요청",
  complaint: "일반 컴플레인",
};

export function DisputeForm() {
  const router = useRouter();
  const [category, setCategory] = useState<DisputeCategory>("complaint");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<SubmitDisputeResult | null>(null);
  const [pending, startTransition] = useTransition();

  const descriptionOk = description.trim().length >= 10;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await submitDisputeAction({
        category,
        description: description.trim(),
      });
      setResult(res);
      if (res.ok) {
        router.push("/store/disputes");
        router.refresh();
      }
    });
  };

  const INPUT_CLASS =
    "kr w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2.5 text-[13px] text-hesya-navy-900 transition-colors focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20 placeholder:text-gray-400";

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <label className="block">
        <span className="kr mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
          분쟁 유형
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DisputeCategory)}
          className={INPUT_CLASS}
        >
          {(Object.keys(CATEGORY_LABELS) as DisputeCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="kr mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
          상황 설명 (10자 이상)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="언제, 어떤 일이 있었는지 자세히 적어주세요."
          className={INPUT_CLASS + " resize-none"}
          required
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !descriptionOk}
          className="kr inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "제출 중..." : "분쟁 신고"}
        </button>
        {result && !result.ok && (
          <span className="kr text-[13px] text-destructive">
            {result.message}
          </span>
        )}
      </div>

      <p className="kr break-keep rounded-md bg-hesya-peach-50 px-4 py-3 text-[12px] leading-relaxed text-gray-600">
        SLA 5영업일 이내에 운영팀이 검토합니다. 처리 결과는 가입 이메일로
        안내됩니다.
      </p>
    </form>
  );
}
