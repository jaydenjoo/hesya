"use client";

/**
 * Plan v3 Phase D2-B2-b — 매장 detail 6 탭 컨테이너.
 *
 * 가로 스크롤 탭 스트립 + 활성 underline. children은 panel 배열 순서로 전달.
 * 탭 라벨 1번이 default active. 모바일 frame 환경에서 horizontal scroll OK.
 */

import { useState } from "react";

interface Props {
  readonly labels: readonly string[];
  readonly children: React.ReactNode;
}

export function DetailTabs({ labels, children }: Props) {
  const [active, setActive] = useState(0);
  const panels = Array.isArray(children) ? children : [children];

  return (
    <div className="border-t border-hesya-peach-200">
      <div className="sticky top-0 z-10 border-b border-hesya-peach-200 bg-hesya-peach-50/95 backdrop-blur">
        <div
          className="flex gap-1 overflow-x-auto px-4"
          style={{ scrollbarWidth: "none" }}
        >
          {labels.map((label, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={[
                  "relative flex-shrink-0 whitespace-nowrap px-3 py-3 text-[12px] font-semibold transition",
                  isActive
                    ? "text-hesya-navy-900"
                    : "text-hesya-navy-900/45 hover:text-hesya-navy-900/75",
                ].join(" ")}
              >
                {label}
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-hesya-amber-500"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div>{panels[active]}</div>
    </div>
  );
}
