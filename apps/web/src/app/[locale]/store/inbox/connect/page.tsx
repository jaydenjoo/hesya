import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getInstagramOAuthUrl } from "@/features/inbox";
import { env } from "@/shared/config/env";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

// OAuth callback route handler가 ?error=...로 내려보낼 수 있는 카테고리만 허용.
// URL을 통한 reflected content injection을 차단.
// 추가 시 callback route(`apps/web/src/app/api/oauth/instagram/callback/route.ts`)와 동기화.
const ALLOWED_OAUTH_ERRORS = ["exchange_failed", "state_mismatch"] as const;
type OAuthError = (typeof ALLOWED_OAUTH_ERRORS)[number];

function isAllowedError(value: string | undefined): value is OAuthError {
  return (
    value !== undefined &&
    (ALLOWED_OAUTH_ERRORS as readonly string[]).includes(value)
  );
}

type MockChannel = {
  readonly key: "whatsapp" | "kakao" | "line" | "messenger";
  readonly icon: string;
  readonly accent: string; // tailwind ring color class
};

const MOCK_CHANNELS: readonly MockChannel[] = [
  { key: "whatsapp", icon: "📲", accent: "ring-green-400/40" },
  { key: "kakao", icon: "💬", accent: "ring-yellow-400/50" },
  { key: "line", icon: "💚", accent: "ring-emerald-400/40" },
  { key: "messenger", icon: "📘", accent: "ring-blue-400/40" },
];

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  try {
    await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const t = await getTranslations("Inbox.notConnected");
  const tFailed = await getTranslations("Inbox.connect");
  const tMulti = await getTranslations("Inbox.multiChannel");
  const errorCode = isAllowedError(sp.error) ? sp.error : null;

  // Mock toggle — prod에선 false (실 IG OAuth만 노출). preview/local은 true로
  // 4 추가 채널 disabled card 시각화. UI 자체는 항상 렌더해 디자인 일관성 유지하되,
  // 라벨/버튼 disabled 표기만 바뀜.
  const mockMode = env.MOCK_MULTI_CHANNEL;

  async function start() {
    "use server";
    const url = await getInstagramOAuthUrl();
    redirect(url);
  }

  return (
    <div className="bg-hesya-peach-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 space-y-1.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Operator · Inbox · Connect
          </p>
          <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
            {tMulti("title")}
          </h1>
          <p className="kr text-[13px] text-gray-600">
            {tMulti("description")}
          </p>
        </header>

        {errorCode ? (
          <div
            role="alert"
            className="kr mb-4 rounded-md border border-[#c9483a] bg-[#fbeae5] px-4 py-3 text-[13px] text-[#c9483a]"
          >
            {tFailed("failed", { reason: errorCode })}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          {/* Instagram — 실 OAuth */}
          <article className="flex flex-col rounded-lg border border-hesya-amber-500/30 bg-white px-5 py-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden="true">
                  📱
                </span>
                <div>
                  <p className="font-semibold text-[14px] text-hesya-navy-900">
                    Instagram
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {tMulti("statusOperational")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {tMulti("badgeReady")}
              </span>
            </div>
            <p className="kr mb-4 flex-1 text-[12px] leading-relaxed text-gray-600">
              {t("description")}
            </p>
            <form action={start}>
              <button
                type="submit"
                className="kr inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-hesya-amber-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600"
              >
                {t("button")}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </article>

          {/* Mock 4채널 */}
          {MOCK_CHANNELS.map((ch) => (
            <article
              key={ch.key}
              className={`flex flex-col rounded-lg border border-gray-200 bg-white/60 px-5 py-4 shadow-sm ring-1 ring-inset ${ch.accent}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl opacity-70" aria-hidden="true">
                    {ch.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-[14px] text-hesya-navy-900">
                      {tMulti(`channel.${ch.key}.name`)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {mockMode
                        ? tMulti("statusMock")
                        : tMulti("statusPendingBusiness")}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  {mockMode ? tMulti("badgeMock") : tMulti("badgePending")}
                </span>
              </div>
              <p className="kr mb-4 flex-1 text-[12px] leading-relaxed text-gray-600">
                {tMulti(`channel.${ch.key}.description`)}
              </p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={tMulti("pendingTooltip")}
                className="kr inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13px] font-semibold text-gray-500"
              >
                {tMulti("connectPending")}
              </button>
            </article>
          ))}
        </section>

        <footer className="mt-6 rounded-md border border-hesya-amber-500/20 bg-hesya-amber-50/40 px-4 py-3 text-[12px] text-hesya-navy-900/80">
          <p className="kr">
            <span aria-hidden="true">ℹ️ </span>
            {tMulti("businessNote")}
          </p>
        </footer>
      </div>
    </div>
  );
}
