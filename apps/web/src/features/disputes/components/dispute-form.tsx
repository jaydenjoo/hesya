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

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">분쟁 유형</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DisputeCategory)}
          className="w-full rounded border px-3 py-2"
        >
          {(Object.keys(CATEGORY_LABELS) as DisputeCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          상황 설명 (10자 이상)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="언제, 어떤 일이 있었는지 자세히 적어주세요."
          className="w-full rounded border px-3 py-2"
          required
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !descriptionOk}
          className="rounded bg-black px-5 py-2 text-white disabled:opacity-40"
        >
          {pending ? "제출 중..." : "분쟁 신고"}
        </button>
        {result && !result.ok && (
          <span className="text-sm text-red-600">{result.message}</span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        SLA 5영업일 이내에 운영팀이 검토합니다. 처리 결과는 가입 이메일로
        안내됩니다.
      </p>
    </form>
  );
}
