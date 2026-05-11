/**
 * Epic 9 § Step 1 — KYC 진위확인 검증용 임시 페이지.
 *
 * E9-13 (DECISIONS § 1.11) AAA 강화 적용:
 *  - SkipLink 첫 요소 → 키보드 사용자 본문 즉시 점프 (WCAG 2.4.1 Level A)
 *  - 모든 텍스트 색상 대비 ≥ 7:1 (text-gray-700 이상, WCAG 1.4.6 AAA)
 *  - 결과 영역 role="status" + aria-live="polite" → SR 자동 announcement
 *  - <main id="main" tabIndex={-1}>로 SkipLink 점프 타겟 + focus 가능
 *
 * 향후 Epic 12 Admin Panel 통합 시 이 디렉토리 흡수 또는 삭제 — AAA 패턴은
 * 그때 매장 사장 onboarding 페이지에 그대로 재사용.
 */
"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { SkipLink } from "@/components/a11y/SkipLink";
import {
  classifyStoreCategoryAction,
  extractOcrFromLicenseAction,
  matchStoreToLocaldata,
  searchLocaldataBeautyShops,
  signSelfDeclarationAction,
  verifyBusinessNumber,
  type ClassifyCategoryActionResult,
  type ExtractOcrActionResult,
  type MatchStoreToLocaldataResult,
  type SearchLocaldataResult,
  type SignSelfDeclarationActionResult,
  type VerifyBusinessNumberResult,
} from "@/lib/kyc/actions";

export default function KycTestPage() {
  return (
    <>
      <SkipLink targetId="main" label="본문으로 건너뛰기" />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-3xl space-y-12 p-8"
      >
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
            KYC 검증 페이지
          </h1>
          <p className="text-sm leading-relaxed text-gray-700">
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
        <hr className="border-gray-200" />
        <OcrExtractSection />
      </main>
    </>
  );
}

/**
 * 결과 영역 라이브 리전 — 항상 mount되어 있어야 SR이 dynamic 변경을 인식.
 * `aria-atomic="true"`로 자식이 변경되면 영역 전체를 다시 announce.
 */
function LiveResult({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {children}
    </div>
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
      <p className="text-xs text-gray-700">
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
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "확인 중..." : "진위확인"}
        </button>
      </form>
      <LiveResult>{result && <ResultBlock result={result} />}</LiveResult>
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
      <p className="text-xs text-gray-700">
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
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "검색 중..." : "검색"}
        </button>
      </form>
      <LiveResult>
        {result && <LocaldataResultBlock result={result} />}
      </LiveResult>
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
      <p className="text-xs text-gray-700">
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
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "매칭 중..." : "매칭"}
        </button>
      </form>
      <LiveResult>{result && <MatchResultBlock result={result} />}</LiveResult>
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
          <div className="text-xs text-gray-700">
            {result.candidate.ROAD_NM_ADDR ?? "(주소 미기재)"}
          </div>
          <div className="flex gap-3 text-xs text-gray-700">
            <span>업종 그룹: {result.candidate.OPN_ATMY_GRP_CD ?? "-"}</span>
            <span>영업상태: {result.candidate.SALS_STTS_CD ?? "-"}</span>
          </div>
        </div>
      )}
      <div className="text-xs text-gray-700">
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
      <p className="text-xs leading-relaxed text-gray-700">
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
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending
            ? "서명 중..."
            : allChecked
              ? "동의 + 서명"
              : "3가지 모두 체크 필요"}
        </button>
      </form>
      <LiveResult>
        {result && <SelfDeclarationResultBlock result={result} />}
      </LiveResult>
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
      <p className="text-xs leading-relaxed text-gray-700">
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
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "분류 중..." : "카테고리 분류"}
        </button>
      </form>
      <LiveResult>
        {result && <CategoryResultBlock result={result} />}
      </LiveResult>
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
        <p className="text-sm text-gray-700">
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
            <div className="text-xs text-gray-700">
              {item.ROAD_NM_ADDR ?? "(주소 미기재)"}
            </div>
            <div className="flex gap-3 text-xs text-gray-700">
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

// PRD § 5.4 Step 4-2 매장 가입 흐름. kyc-test 페이지에선 Step 5(카테고리) 다음에 배치 → Step 6 라벨링.
const OCR_MAX_BYTES = 3 * 1024 * 1024; // 3MB (Server Action 4MB 한도 안전 마진)
const OCR_ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

function OcrExtractSection() {
  const [verificationId, setVerificationId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractOcrActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientError(null);
    setResult(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > OCR_MAX_BYTES) {
      setClientError(
        `파일 ${(f.size / 1024 / 1024).toFixed(2)}MB > 3MB. 압축 후 다시 시도해주세요.`,
      );
      setFile(null);
      return;
    }
    if (!OCR_ACCEPTED.split(",").includes(f.type)) {
      setClientError(`지원 X 형식: ${f.type}. JPEG/PNG/WebP/GIF만 허용.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setResult(null);
    setClientError(null);
    startTransition(async () => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        // "data:image/jpeg;base64,XXXX..." → "XXXX..."
        const base64 = dataUrl.split(",", 2)[1] ?? "";
        const res = await extractOcrFromLicenseAction({
          verificationId: verificationId.trim(),
          imageBase64: base64,
          mediaType: file.type,
        });
        setResult(res);
      };
      reader.onerror = () => {
        setClientError("FileReader 실패");
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Step 6 — 영업신고증 OCR 추출 (Anthropic Opus 4.7 Vision)
      </h2>
      <p className="text-xs leading-relaxed text-gray-700">
        영업신고증·사업자등록증 사진에서 4개
        필드(사업자번호·대표자명·주소·개업일자) + confidence 자동 추출.
        confidence ≥ 0.85 → autoExtracted=true. {"<"} 0.85 → manual_review
        (admin 확인 필요). 이미지 ≤ 3MB. 1회 ~$0.015. PRD § 5.4 Step 4-2.
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
        <Field label="영업신고증 사진 (JPEG/PNG/WebP/GIF, ≤3MB)">
          <input
            type="file"
            accept={OCR_ACCEPTED}
            onChange={onFileChange}
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </Field>
        {clientError && (
          <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-900">
            {clientError}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !file || !verificationId.trim()}
          className="rounded-md bg-hesya-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isPending ? "추출 중..." : "OCR 추출"}
        </button>
      </form>
      <LiveResult>{result && <OcrResultBlock result={result} />}</LiveResult>
    </section>
  );
}

function OcrResultBlock({ result }: { result: ExtractOcrActionResult }) {
  if (!result.ok) {
    return (
      <section className="space-y-2 rounded border bg-red-50 p-4">
        <h2 className="font-semibold">실패: {result.error}</h2>
        <p className="text-sm whitespace-pre-wrap">{result.message}</p>
      </section>
    );
  }
  const bg = result.autoExtracted ? "bg-green-50" : "bg-yellow-50";
  return (
    <section className={`space-y-2 rounded border p-4 ${bg}`}>
      <h2 className="font-semibold">
        {result.autoExtracted
          ? "OCR 자동 추출 완료"
          : "신뢰도 낮음 (manual_review 필요)"}
      </h2>
      <dl className="space-y-1 text-sm">
        <Row
          k="사업자번호"
          v={result.extracted.businessNumber ?? "(추출 실패)"}
        />
        <Row
          k="대표자명"
          v={result.extracted.representativeName ?? "(추출 실패)"}
        />
        <Row k="주소" v={result.extracted.address ?? "(추출 실패)"} />
        <Row k="개업일자" v={result.extracted.startDate ?? "(추출 실패)"} />
        <Row k="confidence" v={result.confidence.toFixed(3)} />
        <Row k="autoExtracted" v={String(result.autoExtracted)} />
        <Row k="verification ID" v={result.verificationId} />
      </dl>
    </section>
  );
}
