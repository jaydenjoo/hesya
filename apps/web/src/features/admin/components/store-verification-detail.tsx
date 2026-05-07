"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveStoreKyc } from "../actions/approve-store-kyc";
import { rejectStoreKyc } from "../actions/reject-store-kyc";

type Props = {
  storeId: string;
  verificationId: string;
  storeName: string;
  businessNumber: string;
  representativeName: string;
  phone: string | null;
  address: unknown;
  businessLicenseImageUrl: string | null;
  declarationNoMassage: boolean | null;
  declarationNoMedicalDevice: boolean | null;
  declarationNoOrientalMedicine: boolean | null;
};

/**
 * Phase 1-β Task C — manual_review 매장 상세 + 승인/거절 액션.
 *
 * - 정보(dl/dt/dd)는 신청 폼 + Task B 트랜잭션에 들어간 컬럼만 표시.
 * - 영업신고증 이미지 URL은 새 탭으로 열림 (육안 검토용).
 * - 거절 사유 3자 미만이면 거절 버튼 disable (server에서도 reject_too_short).
 * - 액션 성공 → useRouter().push("/admin/store-verifications")로 큐 복귀.
 * - 실패 → alert로 사유 노출 (Phase 1-β 단순화 — UX는 Epic 12에서 정식화).
 */
export function StoreVerificationDetail(props: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const reasonOk = reason.trim().length >= 3;

  const onApprove = () => {
    startTransition(async () => {
      const result = await approveStoreKyc({
        storeId: props.storeId,
        verificationId: props.verificationId,
      });
      if (result.ok) {
        router.push("/admin/store-verifications");
      } else {
        alert(`승인 실패: ${result.error}`);
      }
    });
  };

  const onReject = () => {
    startTransition(async () => {
      const result = await rejectStoreKyc({
        storeId: props.storeId,
        verificationId: props.verificationId,
        reason,
      });
      if (result.ok) {
        router.push("/admin/store-verifications");
      } else {
        alert(`거절 실패: ${result.error}`);
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <dl className="space-y-2">
        <Row k="매장명" v={props.storeName} />
        <Row k="사업자번호" v={props.businessNumber} />
        <Row k="대표자명" v={props.representativeName} />
        <Row k="전화" v={props.phone ?? "-"} />
        <Row k="주소" v={formatAddress(props.address)} />
        <div className="flex gap-2">
          <dt className="w-32 font-medium">영업신고증</dt>
          <dd>
            {props.businessLicenseImageUrl ? (
              <a
                href={props.businessLicenseImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                이미지 열기
              </a>
            ) : (
              "-"
            )}
          </dd>
        </div>
        <Row
          k="자기신고: 마사지 X"
          v={formatBool(props.declarationNoMassage)}
        />
        <Row
          k="자기신고: 의료기기 X"
          v={formatBool(props.declarationNoMedicalDevice)}
        />
        <Row
          k="자기신고: 한방 X"
          v={formatBool(props.declarationNoOrientalMedicine)}
        />
      </dl>

      <div className="space-y-3 rounded border p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            거절 사유 (3자 이상)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            {pending ? "처리 중..." : "승인"}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={pending || !reasonOk}
            className="rounded border px-4 py-2 disabled:opacity-40"
          >
            거절
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 font-medium">{k}</dt>
      <dd className="break-all">{v}</dd>
    </div>
  );
}

function formatBool(v: boolean | null): string {
  if (v === true) return "예";
  if (v === false) return "아니오";
  return "-";
}

function formatAddress(v: unknown): string {
  if (v && typeof v === "object" && "full" in v) {
    const full = (v as { full?: unknown }).full;
    if (typeof full === "string") return full;
  }
  if (typeof v === "string") return v;
  return "-";
}
