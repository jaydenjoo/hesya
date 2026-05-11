import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Plan v3 M2.4 stub — schedule 단계에서 선택한 4개 search params를 echo만.
 * 정식 confirm 폼 (손님 정보 + 결제 진행 버튼)은 다음 milestone에서 구현.
 */
export default async function StoreBookConfirmStubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    service?: string;
    staff?: string;
    date?: string;
    time?: string;
  }>;
}) {
  const { id } = await params;
  const { service, staff, date, time } = await searchParams;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          M2.4 (다음 milestone)
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          예약 확정 페이지 준비 중
        </h1>
      </header>

      <section className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-5">
        <p className="mb-3 text-sm text-hesya-navy-900/70">
          선택하신 항목 (URL search params)
        </p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/55">service</dt>
            <dd className="font-mono text-hesya-navy-900">{service ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/55">staff</dt>
            <dd className="font-mono text-hesya-navy-900">{staff ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/55">date</dt>
            <dd className="font-mono text-hesya-navy-900">{date ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hesya-navy-900/55">time</dt>
            <dd className="font-mono text-hesya-navy-900">{time ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <Link
        href={`/c/store/${id}/book/schedule`}
        className="mt-6 inline-block text-sm text-hesya-amber-600 hover:underline"
      >
        ← 다시 선택하기
      </Link>
    </main>
  );
}
