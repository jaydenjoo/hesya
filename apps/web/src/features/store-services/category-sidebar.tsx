"use client";

/**
 * Plan v3 Phase D3-C1-a — Services 페이지 좌측 CategorySidebar.
 *
 * 카테고리별 시술 분류 + 갯수. "All" 기본 + service.category 값에서 distinct
 * 추출. 클릭 시 manager의 filter state 갱신.
 */

interface Props {
  readonly categories: ReadonlyArray<{ key: string; count: number }>;
  readonly active: string;
  readonly onChange: (key: string) => void;
  readonly allLabel: string;
}

const CATEGORY_ICON: Record<string, string> = {
  haircut: "✂",
  color: "✦",
  treatment: "❋",
  perm: "◯",
  nail: "✱",
  makeup: "❀",
  lash: "◐",
  skin: "✿",
  other: "·",
};

function iconFor(key: string): string {
  const k = key.toLowerCase();
  return CATEGORY_ICON[k] ?? "·";
}

export function CategorySidebar({
  categories,
  active,
  onChange,
  allLabel,
}: Props) {
  const total = categories.reduce((s, c) => s + c.count, 0);
  const items = [
    { key: "__all__", count: total, label: allLabel },
    ...categories.map((c) => ({ key: c.key, count: c.count, label: c.key })),
  ];

  return (
    <nav
      aria-label="Service categories"
      className="flex w-full flex-shrink-0 gap-1.5 overflow-x-auto md:w-[180px] md:flex-col md:gap-px md:overflow-visible"
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((item) => {
        const isAll = item.key === "__all__";
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              "flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition md:w-full",
              isActive
                ? "bg-hesya-navy-900 font-semibold text-hesya-peach-50"
                : "text-hesya-navy-900 hover:bg-hesya-peach-50",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "w-4 flex-shrink-0 text-center text-sm",
                isActive ? "text-hesya-amber-500" : "text-hesya-navy-900/45",
              ].join(" ")}
            >
              {isAll ? "▦" : iconFor(item.key)}
            </span>
            <span className="flex-1 truncate capitalize">{item.label}</span>
            <span
              className={[
                "rounded-full px-1.5 text-[10px] font-mono",
                isActive
                  ? "bg-hesya-amber-500/30 text-hesya-peach-50"
                  : "bg-hesya-peach-100 text-hesya-navy-900/65",
              ].join(" ")}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
