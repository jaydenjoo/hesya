/**
 * Epic 9 § Step 1 — KYC 진위확인 검증용 임시 페이지.
 *
 * 향후 Epic 12 Admin Panel 통합 시 이 디렉토리 흡수 또는 삭제.
 * 디자인은 minimal — Phase 1 검증 우선.
 */
"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  classifyStoreCategoryAction,
  matchStoreToLocaldata,
  searchLocaldataBeautyShops,
  signSelfDeclarationAction,
  verifyBusinessNumber,
  type ClassifyCategoryActionResult,
  type MatchStoreToLocaldataResult,
  type SearchLocaldataResult,
  type SignSelfDeclarationActionResult,
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
      <hr className="border-gray-200" />
      <MatchSection />
      <hr className="border-gray-200" />
      <SelfDeclarationSection />
      <hr className="border-gray-200" />
      <CategoryClassifySection />
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

function MatchSection() {
  const [verificationId, setVerificationId] = useState("");
  const [bplcNm, setBplcNm] = useState("");
  const [roadNmAddr, setRoadNmAddr] = useState("");
  const [result, setResult] = useState<MatchStoreToLocaldataResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await matchStoreToLocaldata({
        verificationId: verificationId.trim(),
        bplcNm: bplcNm.trim(),
        roadNmAddr: roadNmAddr.trim() || undefined,
      });
      setResult(res);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Step 3 — 통합 매칭 (NTS verificationId + LOCALDATA 후보 매칭)
      </h2>
      <p className="text-xs text-gray-500">
        Step 1 결과의 verification ID에 LOCALDATA 후보를 검색·매칭하여
        store_verifications 행을 갱신. 사업장명·주소를 정규화 후 가중평균(이름
        0.6 + 주소 0.4) 점수가 0.85 이상이면 matched=true.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="verification ID (Step 1 결과에서 복사)">
          <input
            type="text"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
            placeholder="예: 0c1d2e3f-..."
            required
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
        </Field>
        <Field label="사업장명 (검색 + 매칭 입력)">
          <input
            type="text"
            value={bplcNm}
            onChange={(e) => setBplcNm(e.target.value)}
            placeholder="예: 청담살롱"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="도로명주소 (선택, 동명 변별 권장)">
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
          {isPending ? "매칭 중..." : "매칭"}
        </button>
      </form>
      {result && <MatchResultBlock result={result} />}
    </section>
  );
}

function MatchResultBlock({ result }: { result: MatchStoreToLocaldataResult }) {
  if (!result.ok) {
    return (
      <section className="space-y-2 rounded border bg-red-50 p-4">
        <h2 className="font-semibold">실패: {result.error}</h2>
        <p className="text-sm">{result.message}</p>
      </section>
    );
  }

  const bg = result.matched ? "bg-green-50" : "bg-yellow-50";
  return (
    <section className={`space-y-3 rounded border p-4 ${bg}`}>
      <h2 className="font-semibold">
        {result.matched ? "매칭 성공" : "매칭 실패 (임계값 미만)"} — 후보{" "}
        {result.candidatesCount}건
      </h2>
      {result.bestScore && (
        <dl className="space-y-1 text-sm">
          <Row k="이름 점수" v={result.bestScore.nameScore.toFixed(3)} />
          <Row k="주소 점수" v={result.bestScore.addressScore.toFixed(3)} />
          <Row k="종합 점수" v={result.bestScore.totalScore.toFixed(3)} />
          <Row k="matched" v={String(result.bestScore.matched)} />
        </dl>
      )}
      {result.candidate && (
        <div className="space-y-1 rounded border bg-white p-3 text-sm">
          <div className="font-medium">
            {result.candidate.BPLC_NM ?? "(이름 미기재)"}
          </div>
          <div className="text-xs text-gray-600">
            {result.candidate.ROAD_NM_ADDR ?? "(주소 미기재)"}
          </div>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>업종 그룹: {result.candidate.OPN_ATMY_GRP_CD ?? "-"}</span>
            <span>영업상태: {result.candidate.SALS_STTS_CD ?? "-"}</span>
          </div>
        </div>
      )}
      <div className="text-xs text-gray-500">
        verification ID:{" "}
        <span className="font-mono">{result.verificationId}</span>
      </div>
    </section>
  );
}

function SelfDeclarationSection() {
  const [verificationId, setVerificationId] = useState("");
  const [noMassage, setNoMassage] = useState(false);
  const [noMedicalDevice, setNoMedicalDevice] = useState(false);
  const [noOrientalMedicine, setNoOrientalMedicine] = useState(false);
  const [result, setResult] = useState<SignSelfDeclarationActionResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const allChecked = noMassage && noMedicalDevice && noOrientalMedicine;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await signSelfDeclarationAction({
        verificationId: verificationId.trim(),
        declarations: { noMassage, noMedicalDevice, noOrientalMedicine },
      });
      setResult(res);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Step 4 — 약관 자기신고</h2>
      <p className="text-xs leading-relaxed text-gray-500">
        매장 사장이 가입 시 마사지·의료기기·한방 시술 안 함 3가지에 모두
        동의해야 진행. 한 번 서명되면 immutable (재서명 불가). 의료법 위반 가맹
        차단의 법적 분리 근거 (PRD § 5.4 Step 4).
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="verification ID (Step 1 결과에서 복사)">
          <input
            type="text"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
            placeholder="예: 0c1d2e3f-..."
            required
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
        </Field>
        <DeclarationCheckbox
          checked={noMassage}
          onChange={setNoMassage}
          label="① 마사지·발마사지·스포츠마사지·아로마·경락·림프 등 안마 행위를 일체 제공하지 않습니다 (의료법 88조)"
        />
        <DeclarationCheckbox
          checked={noMedicalDevice}
          onChange={setNoMedicalDevice}
          label="② LED·고주파·울쎄라·인모드·레이저·IPL·보톡스·필러 등 의료기기 시술을 일체 제공하지 않습니다 (의료기기법)"
        />
        <DeclarationCheckbox
          checked={noOrientalMedicine}
          onChange={setNoOrientalMedicine}
          label="③ 침·뜸·부항·한약 등 한방 시술을 일체 제공하지 않습니다 (의료해외진출법)"
        />
        <button
          type="submit"
          disabled={isPending || !allChecked}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending
            ? "서명 중..."
            : allChecked
              ? "동의 + 서명"
              : "3가지 모두 체크 필요"}
        </button>
      </form>
      {result && <SelfDeclarationResultBlock result={result} />}
    </section>
  );
}

function DeclarationCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded border p-3 text-sm hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}

function SelfDeclarationResultBlock({
  result,
}: {
  result: SignSelfDeclarationActionResult;
}) {
  if (result.ok) {
    return (
      <section className="space-y-2 rounded border bg-green-50 p-4">
        <h2 className="font-semibold">서명 완료</h2>
        <dl className="space-y-1 text-sm">
          <Row k="verification ID" v={result.verificationId} />
          <Row k="signedAt" v={result.signedAt.toISOString()} />
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

function CategoryClassifySection() {
  const [verificationId, setVerificationId] = useState("");
  const [result, setResult] = useState<ClassifyCategoryActionResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await classifyStoreCategoryAction({
        verificationId: verificationId.trim(),
      });
      setResult(res);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Step 5 — 카테고리 자동 분류 (Anthropic Sonnet 4.6)
      </h2>
      <p className="text-xs leading-relaxed text-gray-500">
        9개 카테고리(미용업 5종 + 자유업 4종) 중 1개 + confidence 분류. 입력은
        store_verifications row의 LOCALDATA 매칭 결과(bplcNm + OPN_ATMY_GRP_CD).
        confidence ≥ 0.85 → autoClassified=true. {"<"} 0.85 → manual_review
        (admin 확인 필요). 1회 ~$0.003.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="verification ID (Step 1·3 결과에서 복사)">
          <input
            type="text"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
            placeholder="예: 0c1d2e3f-..."
            required
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
        </Field>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "분류 중..." : "카테고리 분류"}
        </button>
      </form>
      {result && <CategoryResultBlock result={result} />}
    </section>
  );
}

function CategoryResultBlock({
  result,
}: {
  result: ClassifyCategoryActionResult;
}) {
  if (!result.ok) {
    return (
      <section className="space-y-2 rounded border bg-red-50 p-4">
        <h2 className="font-semibold">실패: {result.error}</h2>
        <p className="text-sm whitespace-pre-wrap">{result.message}</p>
      </section>
    );
  }
  const bg = result.autoClassified ? "bg-green-50" : "bg-yellow-50";
  return (
    <section className={`space-y-2 rounded border p-4 ${bg}`}>
      <h2 className="font-semibold">
        {result.autoClassified
          ? "자동 분류 완료"
          : "신뢰도 낮음 (manual_review 필요)"}
      </h2>
      <dl className="space-y-1 text-sm">
        <Row k="category" v={result.category} />
        <Row k="confidence" v={result.confidence.toFixed(3)} />
        <Row k="autoClassified" v={String(result.autoClassified)} />
        <Row k="verification ID" v={result.verificationId} />
      </dl>
      {result.reasoning && (
        <p className="rounded border bg-white p-3 text-xs leading-relaxed text-gray-700">
          {result.reasoning}
        </p>
      )}
    </section>
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
