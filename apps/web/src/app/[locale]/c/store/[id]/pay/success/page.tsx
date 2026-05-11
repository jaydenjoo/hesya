import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Plan v3 M2.6 stub — Mock 결제 완료 후 도래. 정식 booking insert + payments
 * row insert + 가짜 IG 메시지 발송은 다음 milestone에서 server action 추가.
 */
export default async function StorePaySuccessStubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    service?: string;
    staff?: string;
    date?: string;
    time?: string;
    name?: string;
    email?: string;
    message?: string;
    method?: string;
    mockTxId?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(id)) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-hesya-amber-50 text-3xl text-hesya-amber-600">
          ✓
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          M2.6 (다음 milestone)
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          모의 결제 완료
        </h1>
        <p className="mt-2 text-sm text-hesya-navy-900/70">
          실 예약 DB 저장은 M2.6 (다음 세션)에서 추가됩니다.
        </p>
      </header>

      <section className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-5">
        <p className="mb-3 text-sm text-hesya-navy-900/70">전달된 데이터</p>
        <dl className="space-y-2 text-sm">
          {(
            [
              "service",
              "staff",
              "date",
              "time",
              "name",
              "email",
              "message",
              "method",
              "mockTxId",
            ] as const
          ).map((key) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="text-hesya-navy-900/55">{key}</dt>
              <dd className="break-all text-right font-mono text-xs text-hesya-navy-900">
                {sp[key] ?? "-"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Link
        href={`/c/store/${id}`}
        className="mt-6 inline-block text-sm text-hesya-amber-600 hover:underline"
      >
        ← 매장으로 돌아가기
      </Link>
    </main>
  );
}
