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
      <dl className="space-y-2.5">
        <Row k="매장명" v={props.storeName} />
        <Row k="사업자번호" v={props.businessNumber} mono />
        <Row k="대표자명" v={props.representativeName} />
        <Row k="전화" v={props.phone ?? "-"} mono />
        <Row k="주소" v={formatAddress(props.address)} />
        <div className="flex gap-3">
          <dt className="kr w-32 flex-shrink-0 font-medium text-hesya-navy-900">
            영업신고증
          </dt>
          <dd className="text-[13px]">
            {props.businessLicenseImageUrl ? (
              <a
                href={props.businessLicenseImageUrl}
                target="_blank"
                rel="noreferrer"
                className="kr font-semibold text-hesya-amber-600 hover:underline"
              >
                이미지 열기 →
              </a>
            ) : (
              <span className="text-gray-500">-</span>
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

      <div className="space-y-3 rounded-md border border-hesya-peach-200 bg-hesya-peach-50 p-4">
        <label className="block">
          <span className="kr mb-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
            거절 사유 (3자 이상)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="kr w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] text-hesya-navy-900 transition-colors focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="kr rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "처리 중..." : "승인"}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={pending || !reasonOk}
            className="kr rounded-md border border-hesya-peach-200 bg-white px-4 py-2 text-[13px] font-medium text-hesya-navy-900 transition-colors hover:border-hesya-amber-500 hover:text-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            거절
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="kr w-32 flex-shrink-0 text-[13px] font-medium text-hesya-navy-900">
        {k}
      </dt>
      <dd
        className={
          (mono ? "mono " : "kr ") + "break-all text-[13px] text-gray-700"
        }
      >
        {v}
      </dd>
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
