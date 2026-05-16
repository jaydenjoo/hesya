import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { env } from "@/shared/config/env";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Plan v4 Sprint 1 Epic F — 슬롯 동기화 mock.
 *
 * 네이버 예약 / 카카오톡 예약은 한국 미용업 사장들이 이미 쓰는 외부 예약 시스템.
 * Hesya 자체 booking과 양방향 슬롯 동기화 필요 — 실 OAuth/Webhook 연동은 각
 * 플랫폼의 비즈니스 계정 심사가 필요해 사업자 등록 prerequisite. 본 페이지는
 * UI mock으로 카드 + 사업자 등록 후 연동 CTA만 표시.
 *
 * 가드: requireStoreOwnerAuth.
 */

type SyncProvider = {
  readonly key: "naver" | "kakao";
  readonly icon: string;
  readonly accent: string;
};

const PROVIDERS: readonly SyncProvider[] = [
  { key: "naver", icon: "🟢", accent: "ring-emerald-400/40" },
  { key: "kakao", icon: "💛", accent: "ring-yellow-400/50" },
];

type MessagingChannel = {
  readonly key: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
  readonly icon: string;
  readonly accent: string;
  readonly ready: boolean;
};

const MESSAGING_CHANNELS: readonly MessagingChannel[] = [
  { key: "instagram", icon: "📱", accent: "ring-pink-400/40", ready: true },
  { key: "whatsapp", icon: "📲", accent: "ring-green-400/40", ready: false },
  { key: "kakao", icon: "💬", accent: "ring-yellow-400/50", ready: false },
  { key: "line", icon: "💚", accent: "ring-emerald-400/40", ready: false },
  { key: "messenger", icon: "📘", accent: "ring-blue-400/40", ready: false },
];

const MESSAGING_NAMES: Record<MessagingChannel["key"], string> = {
  instagram: "Instagram DM",
  whatsapp: "WhatsApp Business",
  kakao: "Kakao 비즈니스",
  line: "LINE Official",
  messenger: "Facebook Messenger",
};

const MESSAGING_DESCS: Record<MessagingChannel["key"], string> = {
  instagram: "K-Beauty 외국인 손님 메시지 핵심 채널",
  whatsapp: "동남아·인도·중동 손님",
  kakao: "국내 손님 + 알림톡",
  line: "일본·대만 손님 + 친구 추가",
  messenger: "Meta Business 페이지 메시지",
};

export default async function StoreIntegrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const t = await getTranslations("StoreIntegrations");
  const mockMode = env.MOCK_MULTI_CHANNEL;

  return (
    <div className="bg-hesya-peach-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 space-y-1.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Operator · Integrations
          </p>
          <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
            {t("title")}
          </h1>
          <p className="kr text-[13px] text-gray-600">{t("subtitle")}</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <article
              key={p.key}
              className={`flex flex-col rounded-lg border border-gray-200 bg-white/70 px-5 py-4 shadow-sm ring-1 ring-inset transition-all hover:bg-white hover:shadow-md hover:ring-2 ${p.accent}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden="true">
                    {p.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-[14px] text-hesya-navy-900">
                      {t(`provider.${p.key}.name`)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {mockMode ? t("statusMock") : t("statusPendingBusiness")}
                    </p>
                  </div>
                </div>
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    mockMode
                      ? "bg-hesya-peach-100 text-hesya-amber-700"
                      : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full ${mockMode ? "bg-hesya-amber-500" : "bg-gray-400"}`}
                  />
                  {mockMode ? t("badgeMock") : t("badgePending")}
                </span>
              </div>
              <p className="kr mb-4 flex-1 text-[12px] leading-relaxed text-gray-600">
                {t(`provider.${p.key}.description`)}
              </p>

              <div className="mb-3 flex items-center gap-2 rounded-md bg-hesya-peach-50/80 px-3 py-2 text-[11px] text-hesya-navy-900/80">
                <span aria-hidden="true">⇄</span>
                <span className="kr">{t("bidirectional")}</span>
              </div>

              <div className="mb-3 flex items-center justify-between rounded-md border border-hesya-peach-100 bg-white px-3 py-1.5 font-mono text-[10.5px]">
                <span className="uppercase tracking-[0.14em] text-hesya-navy-900/55">
                  last sync
                </span>
                <span className="tabular-nums text-hesya-navy-900/45">—</span>
              </div>

              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t("pendingTooltip")}
                className="kr inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13px] font-semibold text-gray-500"
              >
                {t("connectPending")}
              </button>
            </article>
          ))}
        </section>

        <footer className="mt-6 rounded-md border border-hesya-amber-500/20 bg-hesya-amber-50/40 px-4 py-3 text-[12px] text-hesya-navy-900/80">
          <p className="kr">
            <span aria-hidden="true">ℹ️ </span>
            {t("businessNote")}
          </p>
        </footer>

        <div className="mt-10 mb-4 flex items-baseline gap-2">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Messaging channels
          </span>
          <span className="h-px flex-1 bg-hesya-navy-900/8" />
        </div>

        <header className="mb-4 space-y-1">
          <h2 className="font-display text-[20px] italic text-hesya-navy-900">
            메시지 채널 (5)
          </h2>
          <p className="kr text-[12.5px] text-gray-600">
            손님 메시지를 받는 5개 채널 — Instagram만 즉시 연결, 나머지 4개는
            사업자 등록 후. 상세 연결은{" "}
            <Link
              href={`/${locale}/store/inbox/connect`}
              className="font-semibold text-hesya-amber-600 hover:underline"
            >
              Inbox · Connect →
            </Link>{" "}
            에서.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MESSAGING_CHANNELS.map((c) => (
            <article
              key={c.key}
              className={`flex flex-col rounded-lg border border-gray-200 bg-white/70 px-4 py-3.5 shadow-sm ring-1 ring-inset transition-all hover:bg-white hover:shadow-md hover:ring-2 ${c.accent}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-lg" aria-hidden="true">
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[13px] text-hesya-navy-900">
                      {MESSAGING_NAMES[c.key]}
                    </p>
                    <p className="text-[10.5px] text-gray-500">
                      {c.ready ? "즉시 연결 가능" : "사업자 등록 후"}
                    </p>
                  </div>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold",
                    c.ready
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {c.ready ? "READY" : "준비 중"}
                </span>
              </div>
              <p className="kr mb-3 flex-1 text-[11.5px] leading-relaxed text-gray-600 [word-break:keep-all]">
                {MESSAGING_DESCS[c.key]}
              </p>
              <Link
                href={`/${locale}/store/inbox/connect`}
                className="kr inline-flex items-center justify-center gap-1.5 rounded-md border border-hesya-peach-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-hesya-navy-900 transition hover:border-hesya-amber-500 hover:text-hesya-amber-600"
              >
                Inbox에서 관리
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
