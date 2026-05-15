/**
 * C2 Compare tab — 이 매장 vs 인근 매장 2곳 비교 표.
 *
 * reference 'detail-app.jsx' Compare table (490-516) + compareData (144-158).
 * 외국인 손님이 booking 전에 매장 강점/트레이드오프 한눈에 확인.
 * 실제 인근 매장 매칭은 phase ζ (현재 mock 2개 "Salon A", "Salon B").
 */

interface Props {
  readonly storeName: string;
  readonly comingSoonLabel: string;
  readonly guideTitle?: string;
  readonly guideBody?: string;
}

interface CompareRow {
  readonly label: string;
  readonly self: string;
  readonly a: string;
  readonly b: string;
}

const COMPARE_ROWS: ReadonlyArray<CompareRow> = [
  { label: "외국인 평균 객단가", self: "₩90,000", a: "₩105,000", b: "₩88,000" },
  { label: "외국인 평점", self: "4.92", a: "4.71", b: "4.83" },
  { label: "English fluency", self: "5/5", a: "3/5", b: "4/5" },
  { label: "Japanese fluency", self: "5/5", a: "2/5", b: "3/5" },
  { label: "Chinese fluency", self: "4/5", a: "1/5", b: "2/5" },
  { label: "여성 디자이너", self: "6/8", a: "3/8", b: "5/9" },
  { label: "역까지 도보", self: "4분", a: "8분", b: "6분" },
  {
    label: "전문 분야",
    self: "K-drama cuts",
    a: "Bridal hair",
    b: "Men's grooming",
  },
];

export function TabCompare({
  storeName,
  comingSoonLabel,
  guideTitle,
  guideBody,
}: Props) {
  return (
    <div className="px-5 pb-4">
      <p className="pb-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
        {comingSoonLabel}
      </p>
      <div className="overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white">
        <table className="w-full table-fixed text-[11.5px]">
          <thead>
            <tr className="border-b border-hesya-peach-100 bg-hesya-peach-50/60 text-left">
              <th className="w-[34%] px-2.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                항목
              </th>
              <th className="w-[26%] bg-hesya-peach-100/70 px-2.5 py-2 text-center text-[11px] font-semibold text-hesya-navy-900">
                <span className="block max-w-[90px] truncate" title={storeName}>
                  {storeName}
                </span>
              </th>
              <th className="w-[20%] px-2.5 py-2 text-center text-[11px] text-hesya-navy-900/70">
                Salon A
              </th>
              <th className="w-[20%] px-2.5 py-2 text-center text-[11px] text-hesya-navy-900/70">
                Salon B
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r, i) => {
              const last = i === COMPARE_ROWS.length - 1;
              const border = last ? "" : "border-b border-hesya-peach-100";
              return (
                <tr key={r.label} className={border}>
                  <td className="px-2.5 py-1.5 text-[11px] text-hesya-navy-900/70 [word-break:keep-all]">
                    {r.label}
                  </td>
                  <td className="bg-hesya-peach-50/40 px-2.5 py-1.5 text-center font-mono text-[11px] font-semibold text-hesya-navy-900">
                    {r.self}
                  </td>
                  <td className="px-2.5 py-1.5 text-center font-mono text-[11px] text-hesya-navy-900/65">
                    {r.a}
                  </td>
                  <td className="px-2.5 py-1.5 text-center font-mono text-[11px] text-hesya-navy-900/65">
                    {r.b}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(guideTitle || guideBody) && (
        <aside className="mt-3 rounded-2xl bg-hesya-peach-50 px-4 py-3 ring-1 ring-hesya-peach-200">
          {guideTitle && (
            <h4 className="text-[12px] font-semibold text-hesya-navy-900">
              {guideTitle}
            </h4>
          )}
          {guideBody && (
            <p className="mt-1 text-[11px] leading-relaxed text-hesya-navy-900/70 [word-break:keep-all]">
              {guideBody}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
