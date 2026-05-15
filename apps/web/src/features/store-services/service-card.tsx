"use client";

/**
 * Plan v3 Phase D3-C1-a — ServiceCard.
 *
 * 시술 카드 그리드용. 사진 placeholder (services 테이블에 photo 컬럼 X — amber
 * gradient + 한글명 첫 글자) + 가격 + 소요시간 + 6 locale 언어 status pill.
 * 클릭 시 onEdit 호출 (manager가 form 상태 전환).
 */

import type { ServiceRow } from "./services-manager";

const LANGS: ReadonlyArray<{
  readonly key: keyof Pick<
    ServiceRow,
    "nameKo" | "nameEn" | "nameJa" | "nameZhCn" | "nameZhTw" | "nameVi"
  >;
  readonly flag: string;
}> = [
  { key: "nameKo", flag: "🇰🇷" },
  { key: "nameEn", flag: "🇺🇸" },
  { key: "nameJa", flag: "🇯🇵" },
  { key: "nameZhCn", flag: "🇨🇳" },
  { key: "nameZhTw", flag: "🇹🇼" },
  { key: "nameVi", flag: "🇻🇳" },
];

/** Card photo gradient — 4색 cycling (peach/rose/sage/blue × amber). */
const CARD_PHOTO_BGS = [
  "linear-gradient(135deg, #F5DDC8, #D88B5B)",
  "linear-gradient(135deg, #E8C4D6, #D88B5B)",
  "linear-gradient(135deg, #D6E8C9, #D88B5B)",
  "linear-gradient(135deg, #C9D6E8, #D88B5B)",
] as const;
function cardPhotoBg(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (
    CARD_PHOTO_BGS[Math.abs(h) % CARD_PHOTO_BGS.length] ?? CARD_PHOTO_BGS[0]!
  );
}

/** Category emoji icon. */
function iconFor(cat: string): string {
  const k = cat.toLowerCase();
  if (k.includes("cut")) return "✂️";
  if (k.includes("color")) return "🎨";
  if (k.includes("perm")) return "💁";
  if (k.includes("treatment")) return "💆";
  if (k.includes("style")) return "💇";
  return "✨";
}

interface Props {
  readonly row: ServiceRow;
  readonly onEdit: (row: ServiceRow) => void;
  readonly onDelete: (row: ServiceRow) => void;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

export function ServiceCard({
  row,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white transition hover:border-hesya-amber-500 hover:shadow-[0_8px_20px_-12px_rgba(26,34,56,0.25)]">
      <div
        style={{ background: cardPhotoBg(row.id) }}
        className="relative grid aspect-[4/3] place-items-center"
      >
        <span aria-hidden="true" className="text-[44px] opacity-65">
          {iconFor(row.category ?? "etc")}
        </span>
        {row.priceKrw >= 50000 && (
          <span
            aria-label="인기"
            className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-hesya-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_2px_6px_rgba(232,169,122,0.45)]"
          >
            ★ 인기
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex gap-0.5">
          {LANGS.map((l) => {
            const filled = !!row[l.key];
            return (
              <span
                key={l.key}
                aria-hidden="true"
                className={[
                  "grid h-5 w-5 place-items-center rounded text-[10px] leading-none",
                  filled ? "bg-white/90" : "bg-white/30 opacity-50",
                ].join(" ")}
                title={`${l.key}: ${filled ? "ok" : "missing"}`}
              >
                {l.flag}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 py-3">
        <p className="line-clamp-1 text-[14px] font-semibold text-hesya-navy-900">
          {row.nameKo}
        </p>
        {row.nameEn ? (
          <p className="line-clamp-1 text-[11px] text-hesya-navy-900/55">
            {row.nameEn}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="font-mono text-[13px] font-semibold text-hesya-amber-600">
            ₩{row.priceKrw.toLocaleString("ko-KR")}
          </p>
          {row.durationMinutes ? (
            <p className="text-[11px] text-hesya-navy-900/55">
              {row.durationMinutes}분
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-1 border-t border-hesya-peach-100 px-2 py-2">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex-1 rounded-md py-1.5 text-[11px] font-semibold text-hesya-navy-900 transition hover:bg-hesya-peach-50"
        >
          {editLabel}
        </button>
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="flex-1 rounded-md py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-50"
        >
          {deleteLabel}
        </button>
      </div>
    </article>
  );
}
