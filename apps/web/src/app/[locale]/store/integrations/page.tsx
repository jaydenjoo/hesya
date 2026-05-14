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
              className={`flex flex-col rounded-lg border border-gray-200 bg-white/70 px-5 py-4 shadow-sm ring-1 ring-inset ${p.accent}`}
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
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
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
      </div>
    </div>
  );
}
