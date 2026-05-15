/**
 * C3 PR 15 — Appointment 카드 (5 rows + Add to calendar).
 * Reference: booking-app.jsx `.appt-card`.
 *
 * 5 rows: 📅 일시 · ✂️ 시술 · 💁 디자이너 · 📍 매장 · 💵 결제. 각 row 사이
 * dashed divider (`border-b border-dashed`).
 */

interface Props {
  readonly dateLine: string;
  readonly serviceLine: string;
  readonly staffLine?: string;
  readonly storeName: string;
  readonly walkLine?: string;
  readonly paymentPaid: string;
  readonly paymentDue: string;
  readonly addToCalendar: string;
}

function Row({
  icon,
  children,
  divider = true,
}: {
  icon: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-2.5 ${
        divider ? "border-b border-dashed border-hesya-peach-100" : ""
      }`}
    >
      <span aria-hidden="true" className="text-[20px] leading-none">
        {icon}
      </span>
      <div className="flex-1 text-[13px] leading-relaxed text-hesya-navy-900">
        {children}
      </div>
    </div>
  );
}

export function AppointmentCard({
  dateLine,
  serviceLine,
  staffLine,
  storeName,
  walkLine,
  paymentPaid,
  paymentDue,
  addToCalendar,
}: Props) {
  return (
    <section className="rounded-2xl bg-white px-5 py-2 shadow-[0_4px_16px_rgba(26,34,56,0.06)]">
      <Row icon="📅">
        <span className="font-semibold">{dateLine}</span>
      </Row>
      <Row icon="✂️">{serviceLine}</Row>
      {staffLine && <Row icon="💁">{staffLine}</Row>}
      <Row icon="📍">
        <span>{storeName}</span>
        {walkLine && (
          <div className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
            {walkLine}
          </div>
        )}
      </Row>
      <Row icon="💵" divider={false}>
        <span className="font-semibold">{paymentPaid}</span>
        <span className="ml-2 text-[11.5px] text-hesya-navy-900/55">
          {paymentDue}
        </span>
      </Row>
      <button
        type="button"
        className="mt-3 mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hesya-peach-100 px-4 py-2.5 text-[12.5px] font-semibold text-hesya-amber-600 transition hover:bg-hesya-peach-200"
      >
        <span aria-hidden="true">📅</span>
        {addToCalendar}
      </button>
    </section>
  );
}
