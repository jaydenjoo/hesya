/**
 * E9-13 SkipLink — WCAG 2.4.1 (Bypass Blocks) Level A 충족.
 *
 * AAA 강화 페이지(KYC·예약·결제, DECISIONS § 1.11)의 첫 요소로 배치. 키보드
 * 사용자가 Tab 첫 입력 시 visible해서 헤더·네비를 건너뛰고 본문(<main id="...">)
 * 으로 즉시 이동.
 *
 * 디자인 시스템 v4.1 PART A3.3 (focus-visible 가시성) 정합:
 *  - sr-only 평소 숨김
 *  - focus-visible 시 좌상단 고정 + 강한 대비 (neutral-900/white)
 *  - outline-2 + outline-offset-2 (focus ring)
 */
"use client";

interface SkipLinkProps {
  /** 점프 대상 element의 id (예: "main"). `<main id={...}>`와 매칭 필요. */
  targetId: string;
  /** 표시 라벨 — 페이지의 locale에 맞춘 텍스트. 호출처가 결정. */
  label: string;
}

export function SkipLink({ targetId, label }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded focus-visible:bg-neutral-900 focus-visible:px-4 focus-visible:py-2 focus-visible:font-semibold focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      {label}
    </a>
  );
}
