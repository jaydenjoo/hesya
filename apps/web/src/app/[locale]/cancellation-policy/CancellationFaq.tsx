"use client";

import { useCallback, useState } from "react";

type FaqItem = { q: string; a: string };

export function CancellationFaq({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const toggle = useCallback(
    (i: number) => setOpenIdx((cur) => (cur === i ? null : i)),
    [],
  );

  return (
    <>
      {items.map((it, idx) => {
        const open = openIdx === idx;
        const qId = `q${idx + 1}`;
        const aId = `a${idx + 1}`;
        return (
          <div className="faq-item" key={it.q}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={aId}
              id={qId}
              onClick={() => toggle(idx)}
            >
              <span className="q-ko" lang="ko">
                {it.q}
              </span>
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
              className="faq-answer"
              id={aId}
              role="region"
              aria-labelledby={qId}
              lang="ko"
            >
              {it.a}
            </div>
          </div>
        );
      })}
    </>
  );
}
