/**
 * Plan v3 Phase D2-B2-b — Tab: 디자이너 panel.
 *
 * 디자이너 카드. 이름 + 응대 언어 + (있으면) 첫 포트폴리오 사진 1장.
 */

export interface StylistItem {
  readonly id: string;
  readonly name: string;
  readonly languages: readonly string[];
  readonly thumbnailUrl: string | null;
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
    <ul className="space-y-2 px-5 py-4">
      {items.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-2xl border border-hesya-peach-200 bg-white px-3 py-3"
        >
          {p.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
              width="48"
              height="48"
            />
          ) : (
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-hesya-peach-100 font-heading text-[16px] font-semibold italic text-hesya-navy-900">
              {p.name[0]?.toUpperCase() ?? "·"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-hesya-navy-900">
              {p.name}
            </p>
            {p.languages.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {p.languages.slice(0, 4).map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-hesya-peach-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-hesya-navy-900/65"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
