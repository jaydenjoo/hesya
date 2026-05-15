import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  AiAccuracyTile,
  AiInsightPanel,
  BrightSpot,
  CelebrationToasts,
  ChannelBreakdown,
  CriticalAlert,
  DashboardHeader,
  KVerified,
  NationalityTile,
  RecentReviews,
  TodayBookingsTile,
  TodayTimeline,
  WeeklyGmv,
} from "@/features/dashboard";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { env } from "@/shared/config/env";
import { getDisputeLoad, getInboxLoad } from "@/shared/lib/dal/dashboard";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

// Reference 정합 PR 1 — KpiGrid 3행 제거 (rowHero/Mix/Secondary). 실 KPI는
// /store/analytics 페이지로 이관 (별도 task). dashboard는 reference 6 Bento tile
// + Timeline + AIInsight + Reviews 구조로 단순화.
// AIInsight ↔ Timeline 순서 swap — reference 순서 (Timeline 먼저).
const getStoreDashboardCached = unstable_cache(
  async (storeId: string) => {
    const db = createDbClient(env.DATABASE_URL);
    const [inbox, dispute] = await Promise.all([
      getInboxLoad(db, storeId),
      getDisputeLoad(db, storeId),
    ]);
    return { inbox, dispute };
  },
  ["store-dashboard-v2"],
  {
    revalidate: 30,
    tags: ["conversations", "disputes"],
  },
);

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  // shell은 세션 의존 (사용자별) — 캐시 X. inbox/dispute는 storeId 캐시 (30s).
  const [cached, shell] = await Promise.all([
    getStoreDashboardCached(session.storeId),
    getOwnerShellData(),
  ]);
  const { inbox, dispute } = cached;

  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const brightSpot = (() => {
    if (dispute.slaExceeded > 0) {
      return {
        eyebrow: t("brightSpot.urgent"),
        body: t("brightSpot.disputesSlaExceeded", {
          count: dispute.slaExceeded,
        }),
      };
    }
    if (inbox.unreadMessages > 0) {
      return {
        eyebrow: t("brightSpot.today"),
        body: t("brightSpot.inboxUnread", {
          count: inbox.unreadMessages,
          threads: inbox.openThreads,
        }),
      };
    }
    if (dispute.active > 0) {
      return {
        eyebrow: t("brightSpot.today"),
        body: t("brightSpot.disputesActive", { count: dispute.active }),
      };
    }
    return {
      eyebrow: t("brightSpot.today"),
      body: t("brightSpot.allClear"),
    };
  })();

  const now = new Date();
  const dateDay = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  const dateWeekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(now);

  // O1 fast track 단계 1 (W13) — Greeting subtitle 숫자 wire.
  // 실 데이터: 미답 메시지 (inbox.unreadMessages). 오늘 외국인 예약 / 새 후기는
  // mock (Today bookings DAL 신규 + reviews 테이블 ζ phase 도입 prerequisite).
  const todayBookingsMock = 0;
  const newReviewsMock = 0;

  // O1 fast track 단계 1 (W3) — 채널별 미답 분포 (mock).
  // 실 DAL은 conversations group by channel 필요. 현재 fixed ratio:
  // 40% IG / 30% WA / 20% Kakao / 10% LINE → unreadMessages 총합 보존.
  const unread = inbox.unreadMessages;
  const channelEntries = (() => {
    const ratios = [0.4, 0.3, 0.2, 0.1] as const;
    const channels = [
      { key: "instagram", label: "Instagram", icon: "📱" },
      { key: "whatsapp", label: "WhatsApp", icon: "💚" },
      { key: "kakao", label: "Kakao", icon: "💛" },
      { key: "line", label: "LINE", icon: "💬" },
    ];
    const raw = ratios.map((r) => Math.floor(unread * r));
    const drift = unread - raw.reduce((s, n) => s + n, 0);
    if (drift > 0 && raw.length > 0) raw[0] = (raw[0] ?? 0) + drift;
    return channels.map((c, i) => ({ ...c, count: raw[i] ?? 0 }));
  })();

  return (
    <div className="bg-hesya-peach-50">
      <DashboardHeader
        eyebrow="Operator · Dashboard"
        greetingPrefix={t("greetingPrefix")}
        storeName={shell.storeName}
        greetingSuffix={t("greetingSuffix")}
        subtitle={t.rich("greetingSubtitle", {
          todayBookings: todayBookingsMock,
          unread,
          newReviews: newReviewsMock,
          strong: (chunks) => (
            <strong className="font-semibold text-hesya-navy-900">
              {chunks}
            </strong>
          ),
        })}
        dateDay={dateDay}
        dateWeekday={dateWeekday}
        priorityLabel={t("priorityViewLabel")}
      />
      <div className="px-8 pb-10">
        {dispute.active > 0 ? (
          <CriticalAlert
            title={t("criticalAlert.title", { count: dispute.active })}
            body={t("criticalAlert.detail")}
            actionLabel={t("criticalAlert.action")}
          />
        ) : null}
        <ChannelBreakdown
          title={t("channelBreakdown.title")}
          entries={channelEntries}
        />
        <BrightSpot
          eyebrow={brightSpot.eyebrow}
          eyebrowEn="Bright spot"
          body={brightSpot.body}
        />
        <TodayTimeline />
        <AiInsightPanel />
        {/* O1 fast track 단계 3 — W2 GMV + W6 K-Verified.
            mock-first: 실 weekly GMV DAL + kyc tier/renewal schema 확장 별도 task. */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
          <WeeklyGmv
            amountKrw={4_280_000}
            deltaPct={24}
            weekHeights={[40, 55, 48, 70, 62, 85, 92]}
            locale={locale}
          />
          <KVerified
            tier="Gold"
            renewalDate="2026-07-15"
            comingSoonLabel={t("timeline.popoverComingSoon")}
          />
        </div>
        {/* O1 fast track 단계 5a — W1 오늘 예약 + W5 AI 정확도.
            mock-first: bookings 시간대별 집계 / AI 처리 통계 별도 task. */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr]">
          <TodayBookingsTile
            count={7}
            avatars={[
              { flag: "🇯🇵", bgClass: "bg-hesya-peach-200" },
              { flag: "🇨🇳", bgClass: "bg-hesya-peach-100" },
              { flag: "🇺🇸", bgClass: "bg-hesya-peach-50" },
            ]}
            extraCount={4}
            nextLabel="14:00 사쿠라님"
            sparkHours={[1, 2, 0, 3, 1, 0, 2, 1, 1, 0, 2, 0]}
            nowBarIndex={5}
          />
          <AiAccuracyTile pct={94} processedCount={142} />
        </div>
        {/* O1 fast track 단계 4 — W4 국적 대형 타일.
            Reference 색상 5 segments (Hesya peach/amber + navy + 강조 핑크).
            mock-first: page에서 5 segments 주입. 실 DAL은 nationalitySlices 매핑. */}
        <div className="mb-4">
          <NationalityTile
            totalCount={47}
            segments={[
              { flag: "🇯🇵", label: "일본", pct: 35, color: "#D88B5B" },
              { flag: "🇨🇳", label: "중국 (간체)", pct: 25, color: "#E8A97A" },
              { flag: "🇨🇳", label: "중국 (번체)", pct: 18, color: "#F5DDC8" },
              { flag: "🇺🇸", label: "미국", pct: 14, color: "#1A2238" },
              { flag: "🇻🇳", label: "베트남", pct: 8, color: "#E8C4D6" },
            ]}
          />
        </div>
        {/* O1 fast track 단계 4 — W9 최근 후기 cards.
            mock-first: 3 mock reviews (jp/en/zh-CN). reviews 테이블 ζ phase. */}
        <div className="mt-6">
          <RecentReviews comingSoonLabel={t("timeline.popoverComingSoon")} />
        </div>
        {/* O1 fast track 단계 5b — W11 알림 Toast stack.
            mock-first: 4 hardcoded toasts (star/photo/growth/verified) + dismiss.
            실 notifications 파이프라인 별도 task. */}
        <div className="mt-6">
          <CelebrationToasts />
        </div>
        <p className="mt-8 font-mono text-[11px] text-hesya-navy-900/55">
          {t("footerNote")}
        </p>
      </div>
    </div>
  );
}
