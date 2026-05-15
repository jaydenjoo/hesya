/**
 * Plan v3 Phase D2-B2-b — Tab: 디자이너 panel.
 *
 * C5 fast track (2026-05-15): reference 2-column grid 정합 (item 5).
 * 카드 = 원형 포트레이트 + 이름 + spec + 언어 flag + 별점.
 */

export interface StylistItem {
  readonly id: string;
  readonly name: string;
  readonly languages: readonly string[];
  readonly thumbnailUrl: string | null;
  /** C5 fast track 추가: spec 텍스트 (예: "K-drama short cut"). */
  readonly spec?: string;
  /** C5 fast track 추가: 평점 (예: 4.95). DAL 미존재 시 page에서 mock. */
  readonly score?: string;
}

interface Props {
  readonly items: readonly StylistItem[];
  readonly emptyLabel: string;
}

export function TabStylists({ items, emptyLabel }: Props) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-hesya-navy-900/55">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="c-detail-stylist-grid">
      {items.map((p) => (
        <div key={p.id} className="c-detail-stylist-card">
          <div
            className="c-detail-stylist-portrait"
            style={
              p.thumbnailUrl
                ? { backgroundImage: `url(${p.thumbnailUrl})` }
                : undefined
            }
          />
          <div className="c-s-name">{p.name}</div>
          {p.spec && <div className="c-s-spec">{p.spec}</div>}
          <div className="c-s-flags">
            {p.languages.slice(0, 4).map((lang) => (
              <span key={lang}>{langToFlag(lang)} </span>
            ))}
          </div>
          {p.score && (
            <div className="c-s-score">
              <span className="c-star">★</span> {p.score}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function langToFlag(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "en") return "🇺🇸";
  if (l === "ja") return "🇯🇵";
  if (l === "zh-cn" || l === "zh") return "🇨🇳";
  if (l === "zh-tw") return "🇹🇼";
  if (l === "vi") return "🇻🇳";
  if (l === "ko") return "🇰🇷";
  return "🌐";
}
