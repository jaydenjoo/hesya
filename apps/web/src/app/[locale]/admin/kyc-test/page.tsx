/**
 * Epic 9 § Step 1 — KYC 진위확인 검증용 임시 페이지.
 *
 * 향후 Epic 12 Admin Panel 통합 시 이 디렉토리 흡수 또는 삭제.
 * 디자인은 minimal — Phase 1 검증 우선.
 */
"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  searchLocaldataBeautyShops,
  verifyBusinessNumber,
  type SearchLocaldataResult,
  type VerifyBusinessNumberResult,
} from "@/lib/kyc/actions";

export default function KycTestPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-12 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">KYC 검증 페이지</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          Epic 9 Step 1·2 — 국세청 진위확인 + LOCALDATA 미용업 영업신고 조회.
          로그인 필요.
        </p>
      </header>

      <NtsSection />
      <hr className="border-gray-200" />
      <LocaldataSection />
    </main>
  );
}

function NtsSection() {
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
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Step 1 — 국세청 진위확인</h2>
      <p className="text-xs text-gray-500">
        공개 사업자번호 예시: 삼성전자 1248100998 / 네이버 2208145242 / 카카오
        1208147521.
      </p>
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
    </section>
  );
}

function LocaldataSection() {
  const [bplcNm, setBplcNm] = useState("");
  const [roadNmAddr, setRoadNmAddr] = useState("");
  const [result, setResult] = useState<SearchLocaldataResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await searchLocaldataBeautyShops({
        bplcNm: bplcNm.trim(),
        roadNmAddr: roadNmAddr.trim() || undefined,
        pageNo: 1,
        numOfRows: 10,
      });
      setResult(res);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Step 2 — LOCALDATA 미용업 영업신고 조회
      </h2>
      <p className="text-xs text-gray-500">
        행정안전부 생활_미용업 (data.go.kr 1741000). 사업자번호 검색은 미지원 —
        사업장명 LIKE 검색. 동명 매장 변별을 위해 도로명주소 일부 추가 권장.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="사업장명 (필수, 일부 일치)">
          <input
            type="text"
            value={bplcNm}
            onChange={(e) => setBplcNm(e.target.value)}
            placeholder="예: 청담살롱"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="도로명주소 (선택, 일부 일치)">
          <input
            type="text"
            value={roadNmAddr}
            onChange={(e) => setRoadNmAddr(e.target.value)}
            placeholder="예: 강남구 청담동"
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "검색 중..." : "검색"}
        </button>
      </form>
      {result && <LocaldataResultBlock result={result} />}
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

function LocaldataResultBlock({ result }: { result: SearchLocaldataResult }) {
  if (!result.ok) {
    return (
      <section className="space-y-2 rounded border bg-red-50 p-4">
        <h2 className="font-semibold">실패: {result.error}</h2>
        <p className="text-sm">{result.message}</p>
      </section>
    );
  }

  if (result.items.length === 0) {
    return (
      <section className="space-y-2 rounded border bg-gray-50 p-4">
        <h2 className="font-semibold">검색 결과 없음</h2>
        <p className="text-sm text-gray-600">
          입력한 사업장명과 일치하는 미용업 영업신고가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded border bg-blue-50 p-4">
      <h2 className="font-semibold">
        검색 결과 {result.items.length}건
        {result.totalCount !== null
          ? ` / 전체 ${result.totalCount}건 (page ${result.pageNo ?? "-"})`
          : ""}
      </h2>
      <ul className="space-y-2 text-sm">
        {result.items.map((item, idx) => (
          <li key={idx} className="space-y-1 rounded border bg-white p-3">
            <div className="font-medium">{item.BPLC_NM ?? "(이름 미기재)"}</div>
            <div className="text-xs text-gray-600">
              {item.ROAD_NM_ADDR ?? "(주소 미기재)"}
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span>인허가: {item.LCPMT_YMD ?? "-"}</span>
              <span>영업상태: {item.SALS_STTS_CD ?? "-"}</span>
              <span>지자체: {item.OPN_ATMY_GRP_CD ?? "-"}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
