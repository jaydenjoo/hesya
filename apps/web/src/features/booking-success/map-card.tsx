/**
 * Plan v3 Phase D2-B1 — 지도 카드. 매장 주소를 외국인이 자주 쓰는 3 지도 앱에
 * 딥링크. 모든 link는 새 탭에서 (`target="_blank"`).
 */

interface Props {
  readonly title: string;
  readonly addressText: string;
  readonly labels: {
    readonly apple: string;
    readonly google: string;
    readonly naver: string;
  };
}

function buildLinks(query: string) {
  const q = encodeURIComponent(query);
  return {
    apple: `https://maps.apple.com/?q=${q}`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    naver: `https://map.naver.com/v5/search/${q}`,
  };
}

export function MapCard({ title, addressText, labels }: Props) {
  const links = buildLinks(addressText);
  return (
    <section className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
        {title}
      </p>
      <p className="mb-4 text-sm leading-relaxed text-hesya-navy-900">
        {addressText}
      </p>
      <div className="flex flex-wrap gap-2">
        <MapLink href={links.apple} label={labels.apple} icon="" />
        <MapLink href={links.google} label={labels.google} icon="◯" />
        <MapLink href={links.naver} label={labels.naver} icon="N" />
      </div>
    </section>
  );
}

function MapLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-hesya-navy-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-hesya-navy-900 transition hover:border-hesya-navy-900 hover:bg-hesya-peach-50"
    >
      <span aria-hidden="true" className="text-sm">
        {icon}
      </span>
      {label}
    </a>
  );
}
