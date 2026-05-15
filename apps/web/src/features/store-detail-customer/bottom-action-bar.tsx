/**
 * Plan v3 Phase D2-B2-a — Bottom action bar.
 *
 * iPhone frame 하단 고정. 하트(즐겨찾기 placeholder) + 채팅(placeholder) +
 * Book CTA. 즐겨찾기·채팅 wire-up은 M4/M5에서 (현재 buton stub).
 */

import { Link } from "@/i18n/navigation";

interface Props {
  readonly bookHref: string;
  readonly bookLabel: string;
  readonly favoriteLabel: string;
  readonly chatLabel: string;
  /**
   * C5 100% — 선택된 시술 라벨 (메뉴 + 가격). 표시 시 CTA 안에 2-line 스택.
   * Reference detail-app.jsx:665-674 sd-cta-stack + selected-svc.
   * 미지정 시 기본 single-line CTA.
   */
  readonly selectedServiceLabel?: string;
}

export function BottomActionBar({
  bookHref,
  bookLabel,
  favoriteLabel,
  chatLabel,
  selectedServiceLabel,
}: Props) {
  return (
    <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-hesya-peach-200 bg-hesya-peach-50/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        aria-label={favoriteLabel}
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border border-hesya-peach-200 bg-white text-hesya-navy-900 transition hover:border-trust-rose hover:text-trust-rose"
      >
        <span aria-hidden="true" className="text-lg">
          ♡
        </span>
      </button>
      <button
        type="button"
        aria-label={chatLabel}
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border border-hesya-peach-200 bg-white text-hesya-navy-900 transition hover:border-hesya-amber-500 hover:text-hesya-amber-600"
      >
        <span aria-hidden="true" className="text-lg">
          ✉
        </span>
      </button>
      <Link
        href={bookHref}
        className={
          "flex flex-1 items-center justify-center rounded-full bg-hesya-navy-900 px-5 text-sm font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 " +
          (selectedServiceLabel ? "py-2" : "h-11")
        }
      >
        {selectedServiceLabel ? (
          <span className="flex flex-col items-center gap-0.5">
            <span>{bookLabel} →</span>
            <span
              data-testid="bottom-bar-selected-svc"
              className="text-[10px] font-normal text-hesya-peach-50/80"
            >
              {selectedServiceLabel}
            </span>
          </span>
        ) : (
          <>{bookLabel} →</>
        )}
      </Link>
    </div>
  );
}
