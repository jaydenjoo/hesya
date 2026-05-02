/**
 * Epic 9 § Step 1 — KYC 진위확인 검증용 임시 페이지.
 *
 * 향후 Epic 12 Admin Panel 통합 시 이 디렉토리 흡수 또는 삭제.
 * 디자인은 minimal — Phase 1 검증 우선.
 */
"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  verifyBusinessNumber,
  type VerifyBusinessNumberResult,
} from "@/lib/kyc/actions";

export default function KycTestPage() {
  const [bNo, setBNo] = useState("");
  const [startDt, setStartDt] = useState("");
  const [pNm, setPNm] = useState("");
  const [result, setResult] = useState<VerifyBusinessNumberResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await verifyBusinessNumber({
        b_no: bNo.replace(/-/g, "").trim(),
        start_dt: startDt.replace(/-/g, "").trim(),
        p_nm: pNm.trim(),
      });
      setResult(res);
    });
  };

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">KYC 진위확인 검증 페이지</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          Epic 9 Step 1 — 국세청 사업자등록 진위확인. 로그인 필요.
          <br />
          공개 사업자번호 예시: 삼성전자 1248100998 / 네이버 2208145242 / 카카오
          1208147521.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="사업자등록번호 (하이픈 OK, 10자리 숫자)">
          <input
            type="text"
            value={bNo}
            onChange={(e) => setBNo(e.target.value)}
            placeholder="1248100998 또는 124-81-00998"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="개업일자 (YYYYMMDD 또는 YYYY-MM-DD)">
          <input
            type="text"
            value={startDt}
            onChange={(e) => setStartDt(e.target.value)}
            placeholder="19690113"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="대표자명">
          <input
            type="text"
            value={pNm}
            onChange={(e) => setPNm(e.target.value)}
            placeholder="이재용"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "확인 중..." : "진위확인"}
        </button>
      </form>

      {result && <ResultBlock result={result} />}
    </main>
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
      <span className="block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function ResultBlock({ result }: { result: VerifyBusinessNumberResult }) {
  if (result.ok) {
    const ok = result.validationResult === "valid_match";
    return (
      <section
        className={`space-y-2 rounded border p-4 ${
          ok ? "bg-green-50" : "bg-yellow-50"
        }`}
      >
        <h2 className="font-semibold">
          {ok ? "진위 일치" : "진위 불일치"} ({result.validationResult})
        </h2>
        <dl className="space-y-1 text-sm">
          <Row k="valid 코드" v={result.validCode} />
          <Row k="영업상태 (b_stt)" v={result.ntsStatus ?? "-"} />
          <Row k="과세유형 (tax_type)" v={result.ntsTaxType ?? "-"} />
          <Row k="verification ID" v={result.verificationId} />
        </dl>
      </section>
    );
  }
  return (
    <section className="space-y-2 rounded border bg-red-50 p-4">
      <h2 className="font-semibold">실패: {result.error}</h2>
      <p className="text-sm">{result.message}</p>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 font-medium">{k}</dt>
      <dd className="break-all font-mono">{v}</dd>
    </div>
  );
}
