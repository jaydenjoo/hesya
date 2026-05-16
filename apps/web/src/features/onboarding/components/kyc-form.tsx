"use client";

import { useState } from "react";
import type { KycApplication } from "../schema";

type Props = {
  onSubmit: (input: Partial<KycApplication>) => void | Promise<void>;
  pending?: boolean;
};

/**
 * Phase 1-β Task B — owner KYC 신청 폼.
 *
 * 자기신고 3건 모두 체크해야 submit enable. 한 건이라도 false면 server에서도
 * zod로 reject (UI/server 이중 강제).
 *
 * shadcn checkbox/label/form 미설치 상태 — 일회용 폼이라 inline Field/Check
 * 헬퍼만 사용 (CLAUDE.md 4원칙 2번 Simplicity First).
 */
export function KycForm({ onSubmit, pending }: Props) {
  const [storeName, setStoreName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);
  const declsOk = decl1 && decl2 && decl3;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // 자기신고 미체크면 schema literal(true)에서 reject되지만 UX상
        // 사전 차단도 유지 (button disabled).
        void onSubmit({
          storeName,
          representativeName,
          businessNumber,
          phone,
          address,
          businessLicenseImageUrl: imageUrl,
          declarationNoMassage: decl1 ? true : undefined,
          declarationNoMedicalDevice: decl2 ? true : undefined,
          declarationNoOrientalMedicine: decl3 ? true : undefined,
        });
      }}
      className="space-y-5"
    >
      <div className="space-y-4 rounded-2xl border border-hesya-peach-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §01 · Store Info
        </p>
        <Field
          label="매장명"
          value={storeName}
          onChange={setStoreName}
          required
        />
        <Field
          label="사업자번호 (숫자 10자리)"
          value={businessNumber}
          onChange={setBusinessNumber}
          required
          pattern="\d{10}"
        />
        <Field
          label="대표자명"
          value={representativeName}
          onChange={setRepresentativeName}
          required
        />
        <Field
          label="전화 (숫자만)"
          value={phone}
          onChange={setPhone}
          required
        />
        <Field label="주소" value={address} onChange={setAddress} required />
      </div>

      <div className="space-y-4 rounded-2xl border border-hesya-peach-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §02 · License
        </p>
        <Field
          label="영업신고증 이미지 URL"
          value={imageUrl}
          onChange={setImageUrl}
          required
          type="url"
        />
      </div>

      <fieldset className="space-y-2.5 rounded-xl border border-hesya-peach-200 bg-hesya-peach-50 p-4">
        <legend className="kr px-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          §03 · Self-Declaration
        </legend>
        <p className="kr px-1 pb-1 text-[12px] text-hesya-navy-900/70">
          모두 체크 필수
        </p>
        <Check
          label="마사지업·안마시술소 영업하지 않습니다"
          checked={decl1}
          onChange={setDecl1}
        />
        <Check
          label="의료기기 사용하지 않습니다"
          checked={decl2}
          onChange={setDecl2}
        />
        <Check
          label="한방 시술하지 않습니다"
          checked={decl3}
          onChange={setDecl3}
        />
      </fieldset>
      <button
        type="submit"
        disabled={!declsOk || pending}
        data-testid="kyc-form-submit"
        className="kr w-full rounded-md bg-hesya-amber-500 px-4 py-2.5 text-sm font-semibold text-white not-disabled:cursor-pointer not-disabled:hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "제출 중..." : "제출"}
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  pattern?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="kr mb-1.5 block text-[13px] font-medium text-hesya-navy-900">
        {props.label}
      </span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        pattern={props.pattern}
        className="kr w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] text-hesya-navy-900 outline-none focus:border-hesya-amber-500 focus:ring-2 focus:ring-hesya-amber-500/20"
      />
    </label>
  );
}

function Check(props: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="kr flex cursor-pointer items-center gap-2.5 text-[13px] text-hesya-navy-900">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-hesya-amber-500"
      />
      <span className="break-keep">{props.label}</span>
    </label>
  );
}
