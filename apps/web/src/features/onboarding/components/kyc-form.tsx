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
      className="max-w-lg space-y-4"
    >
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
      <Field label="전화 (숫자만)" value={phone} onChange={setPhone} required />
      <Field label="주소" value={address} onChange={setAddress} required />
      <Field
        label="영업신고증 이미지 URL"
        value={imageUrl}
        onChange={setImageUrl}
        required
        type="url"
      />
      <fieldset className="space-y-2 rounded border p-4">
        <legend className="font-medium">자기신고 (모두 체크 필수)</legend>
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
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
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
      <span className="mb-1 block text-sm">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        pattern={props.pattern}
        className="w-full rounded border px-3 py-2"
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
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}
