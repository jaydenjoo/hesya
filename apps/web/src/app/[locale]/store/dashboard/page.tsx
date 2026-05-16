import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  AiAccuracyTile,
  AiInsightPanel,
  BrightSpot,
  CriticalAlert,
  DashboardHeader,
  InboxTile,
  KVerified,
  NationalityTile,
  RecentReviews,
  TodayBookingsTile,
  TodayTimeline,
  WeeklyGmv,
} from "@/features/dashboard";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import {
  emptyDashboardAiAccuracy,
  emptyDashboardBookings,
  emptyDashboardGreeting,
  emptyDashboardNationality,
  emptyDashboardWeeklyGmv,
  mockDashboardAiAccuracy,
  mockDashboardBookings,
  mockDashboardGreeting,
  mockDashboardKVerified,
  mockDashboardNationality,
  mockDashboardWeeklyGmv,
} from "@/lib/mock-fixtures/dashboard";
import { env } from "@/shared/config/env";
import { getDisputeLoad, getInboxLoad } from "@/shared/lib/dal/dashboard";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

// Reference 정합 — dashboard는 reference 6 Bento tile + Timeline + AIInsight +
// Reviews 구조. Row 1 (3-col 1.15fr:1fr:1fr): TodayBookings | WeeklyGmv |
// InboxTile. Row 2 (3-col 1.6fr:1fr:1fr): NationalityTile | AiAccuracy |
// KVerified. ChannelBreakdown은 InboxTile 안으로 흡수.
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

  // Reference 정합 PR 4 — BrightSpot은 reference의 celebratory rotating 3-msg.
  // 이전 동적 brightSpot (dispute/inbox 상태 기반)은 제거 — CriticalAlert가
  // urgent 케이스를 별도 처리. BrightSpot은 mock 3 메시지 (i18n).
  const brightSpotItems: ReadonlyArray<string> = [
    t("brightSpot.items.review5Star"),
    t("brightSpot.items.newForeignRecord"),
    t("brightSpot.items.aiTimeSaved"),
  ];

  const now = new Date();
  const dateDay = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(now);
  // Reference 정합 PR 4 — 날씨 정보 mock 표시. 실 weather API 연결은 별도
  // task (기상청 / OpenWeatherMap). 현재는 i18n 라벨로 고정 표시.
  const dateWeekday = `${weekday} · ${t("weatherMock")}`;

  // 세션 46 — inline mock → mock-fixtures/dashboard.ts 분리.
  // MOCK_FIXTURES=true (preview / 외부 시연) 시 풍부한 mock,
  // false (prod, 베타 매장 매칭 전) 시 empty fallback. 베타 후 실 DAL wire.
  const useFixtures = env.MOCK_FIXTURES;
  const greeting = useFixtures ? mockDashboardGreeting : emptyDashboardGreeting;
  const bookingsData = useFixtures
    ? mockDashboardBookings
    : emptyDashboardBookings;
  const gmvData = useFixtures
    ? mockDashboardWeeklyGmv
    : emptyDashboardWeeklyGmv;
  const nationalityData = useFixtures
    ? mockDashboardNationality
    : emptyDashboardNationality;
  const aiAccuracyData = useFixtures
    ? mockDashboardAiAccuracy
    : emptyDashboardAiAccuracy;
  // KVerified는 실 데이터 (stores.kVerificationTier 등) prerequisite 전이라
  // 항상 mock — 베타 매장 매칭 시 stores 테이블에서 직접 wire.
  const kVerifiedData = mockDashboardKVerified;

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
        greetingPrefix={t("greetingPrefix")}
        storeName={shell.storeName}
        greetingSuffix={t("greetingSuffix")}
        subtitle={t.rich("greetingSubtitle", {
          todayBookings: greeting.todayBookings,
          unread,
          newReviews: greeting.newReviews,
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
        <BrightSpot
          items={brightSpotItems}
          eyebrow={t("brightSpot.eyebrow")}
          eyebrowEn={t("brightSpot.eyebrowEn")}
          viewMoreLabel={t("brightSpot.viewMore")}
        />
        {/* Reference Bento Row 1 — 3-col (1.15fr:1fr:1fr):
            TodayBookings | WeeklyGmv | InboxTile. */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_1fr_1fr]">
          <TodayBookingsTile
            count={bookingsData.count}
            avatars={[...bookingsData.avatars]}
            extraCount={bookingsData.extraCount}
            nextLabel={bookingsData.nextLabel}
            sparkHours={[...bookingsData.sparkHours]}
            nowBarIndex={bookingsData.nowBarIndex}
          />
          <WeeklyGmv
            amountKrw={gmvData.amountKrw}
            deltaPct={gmvData.deltaPct}
            weekHeights={[...gmvData.weekHeights]}
            locale={locale}
          />
          <InboxTile
            unreadTotal={inbox.unreadMessages}
            channels={channelEntries}
          />
        </div>
        {/* Reference Bento Row 2 — 3-col (1.6fr:1fr:1fr):
            NationalityTile | AiAccuracy | KVerified. */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr_1fr]">
          <NationalityTile
            totalCount={nationalityData.totalCount}
            segments={[...nationalityData.segments]}
          />
          <AiAccuracyTile
            pct={aiAccuracyData.pct}
            processedCount={aiAccuracyData.processedCount}
          />
          <KVerified
            tier={kVerifiedData.tier}
            renewalDate={kVerifiedData.renewalDate}
            comingSoonLabel={t("timeline.popoverComingSoon")}
          />
        </div>
        <TodayTimeline />
        <AiInsightPanel />
        {/* O1 fast track 단계 4 — W9 최근 후기 cards.
            mock-first: 3 mock reviews (jp/en/zh-CN). reviews 테이블 ζ phase. */}
        <div className="mt-6">
          <RecentReviews comingSoonLabel={t("timeline.popoverComingSoon")} />
        </div>
        {/* CelebrationToasts (W11)는 reference 정합 PR 3에서 OwnerShell 우측
            패널로 이동 — 모든 /store/* 페이지에서 표시. */}
        <p className="mt-8 font-mono text-[11px] text-hesya-navy-900/55">
          {t("footerNote")}
        </p>
      </div>
    </div>
  );
}
