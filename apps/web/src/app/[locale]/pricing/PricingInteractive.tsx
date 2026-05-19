"use client";

/**
 * Pricing 페이지의 클라이언트 인터랙션 (FAQ accordion + mobile tier selector).
 * Reference: docs/design/reference/Hesya Pricing.html L720-757.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const CHECK_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="포함"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MISS_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="미포함"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
);

type CompareRow = {
  k: string;
  values: { free: string; pro: string; ent: string };
};

const COMPARE_GROUPS: Array<{ name: string; rows: CompareRow[] }> = [
  {
    name: "응답 자동화",
    rows: [
      {
        k: "영업시간 외 자동 응답",
        values: { free: "check", pro: "check", ent: "check" },
      },
      { k: "AI 톤 학습", values: { free: "miss", pro: "check", ent: "check" } },
      {
        k: "메시지 수",
        values: { free: "100건/월", pro: "무제한", ent: "무제한" },
      },
    ],
  },
  {
    name: "다국어 + 결제",
    rows: [
      {
        k: "다국어 (5개)",
        values: { free: "check", pro: "check", ent: "check" },
      },
      { k: "채널 수", values: { free: "1개", pro: "4개", ent: "무제한" } },
      { k: "결제 통합", values: { free: "miss", pro: "check", ent: "check" } },
    ],
  },
  {
    name: "매장 운영 도구",
    rows: [
      {
        k: "매장 대시보드",
        values: { free: "miss", pro: "check", ent: "check" },
      },
      { k: "다매장 통합", values: { free: "miss", pro: "miss", ent: "check" } },
    ],
  },
  {
    name: "분석 + API",
    rows: [
      { k: "API 액세스", values: { free: "miss", pro: "miss", ent: "check" } },
    ],
  },
  {
    name: "지원",
    rows: [
      { k: "SLA", values: { free: "이메일", pro: "3분 응답", ent: "99.9%" } },
      { k: "전담 매니저", values: { free: "miss", pro: "miss", ent: "check" } },
    ],
  },
];

type Tier = "free" | "pro" | "ent";

function renderValue(val: string) {
  if (val === "check") return <span className="v check">{CHECK_SVG}</span>;
  if (val === "miss") return <span className="v miss">{MISS_SVG}</span>;
  const isMono = /[0-9%]/.test(val);
  return <span className={isMono ? "v mono" : "v"}>{val}</span>;
}

export function PricingMobileCompare() {
  const [tier, setTier] = useState<Tier>("pro");
  return (
    <div className="compare-mobile">
      <div className="tier-selector" role="tablist" aria-label="비교할 플랜">
        {(["free", "pro", "ent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tier === t}
            onClick={() => setTier(t)}
          >
            {t === "free" ? "Free" : t === "pro" ? "Pro" : "Enterprise"}
          </button>
        ))}
      </div>
      <div className="compare-list">
        {COMPARE_GROUPS.map((g) => (
          <div key={g.name}>
            <div className="compare-grp" lang="ko">
              {g.name}
            </div>
            {g.rows.map((r) => (
              <div key={r.k} className="compare-row">
                <span className="k" lang="ko">
                  {r.k}
                </span>
                {renderValue(r.values[tier])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type FaqEntry = { q: string; a: string };

export function PricingFaq({ items }: { items: FaqEntry[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const toggle = useCallback(
    (i: number) => setOpenIdx((cur) => (cur === i ? null : i)),
    [],
  );

  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  return (
    <div className="faq-grid">
      <div>
        {left.map((it, idx) => (
          <FaqRow
            key={it.q}
            item={it}
            open={openIdx === idx}
            onToggle={() => toggle(idx)}
            qId={`q${idx}`}
            aId={`a${idx}`}
          />
        ))}
      </div>
      <div>
        {right.map((it, j) => {
          const idx = mid + j;
          return (
            <FaqRow
              key={it.q}
              item={it}
              open={openIdx === idx}
              onToggle={() => toggle(idx)}
              qId={`q${idx}`}
              aId={`a${idx}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
  qId,
  aId,
}: {
  item: FaqEntry;
  open: boolean;
  onToggle: () => void;
  qId: string;
  aId: string;
}) {
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Ensure focus management — no-op for now, here for future enhancement.
  }, [open]);
  return (
    <div className="faq-item">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={aId}
        id={qId}
        lang="ko"
        onClick={onToggle}
      >
        <span>{item.q}</span>
        <svg
          className="chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        ref={answerRef}
        className="faq-answer"
        id={aId}
        role="region"
        aria-labelledby={qId}
        lang="ko"
      >
        {item.a}
      </div>
    </div>
  );
}
