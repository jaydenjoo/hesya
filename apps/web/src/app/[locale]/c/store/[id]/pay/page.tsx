import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Plan v3 M2.5 stub — confirm 폼 제출 후 도착. 정식 Mock 결제 UI (Stripe/Alipay/
 * WeChat 토글 + 즉시 succeeded)는 다음 milestone에서 구현.
 */
export default async function StorePayStubPage({
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
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  if (!UUID_RE.test(id)) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          M2.5 (다음 milestone)
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-hesya-navy-900"
          style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}
        >
          결제 페이지 준비 중
        </h1>
        <p className="mt-2 text-sm text-hesya-navy-900/70">
          MOCK_PAYMENT 분기 + 가짜 Stripe/Alipay/WeChat UI는 다음 세션
          milestone에서 추가됩니다.
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
        href={`/c/store/${id}/book/schedule`}
        className="mt-6 inline-block text-sm text-hesya-amber-600 hover:underline"
      >
        ← 다시 선택하기
      </Link>
    </main>
  );
}
