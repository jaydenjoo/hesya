import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  BrightSpot,
  ChannelBreakdown,
  CriticalAlert,
  DashboardHeader,
  DistributionPie,
  KVerified,
  KpiGrid,
  TodayTimeline,
  WeeklyGmv,
  type DistributionSlice,
  type KpiEntry,
} from "@/features/dashboard";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { env } from "@/shared/config/env";
import {
  countBookingsByService,
  countBookingsByStaff,
} from "@/shared/lib/dal/bookings";
import {
  getCurrentMonthRange,
  getDisputeLoad,
  getInboxLoad,
  getKycStatus,
  getMonthlyBookingStats,
  getNationalityMix,
} from "@/shared/lib/dal/dashboard";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 4 (ε phase) / Phase D4-D1 — 매장 운영 대시보드.
 *
 * 가드 실패 → /sign-in. 실측 KPI 5개 (미응답 / 분쟁 / KYC / 시술 분포 /
 * 디자이너 분포) + coming-soon placeholder 5개. Epic 2 결제 도입 후 매출·객단가·
 * 재방문률·노쇼율, ζ 베타 매칭 후 국적 분포가 활성화.
 *
 * D4-D1: 디자인 정합 header / KPI card 재구성.
 */

/**
 * 매장 dashboard 10 DAL 묶음 30초 캐시 — storeId + month key.
 *
 * 매장 사장이 dashboard 새로고침 / 다른 페이지 갔다가 돌아오는 패턴에서 cache hit.
 * 베타 5곳 × 1~2 month = 10 cache entry max. 메모리 부담 미미.
 *
 * 30s 짧게: 미응답 메시지 / 분쟁 등 즉시성 중요한 데이터 — stale 영향 최소화.
 */
const getStoreDashboardCached = unstable_cache(
  async (storeId: string, monthKey: string) => {
    const [from, to] = monthKey.split("|");
    const monthRange = {
      fromDate: new Date(from!),
      toDate: new Date(to!),
    };
    const db = createDbClient(env.DATABASE_URL);
    const [
      inbox,
      dispute,
      kyc,
      serviceCounts,
      staffCounts,
      servicesList,
      staffList,
      bookingStats,
      nationalityMix,
    ] = await Promise.all([
      getInboxLoad(db, storeId),
      getDisputeLoad(db, storeId),
      getKycStatus(db, storeId),
      countBookingsByService(db, storeId, monthRange),
      countBookingsByStaff(db, storeId, monthRange),
      listServicesByStore(db, storeId),
      listStaffByStore(db, storeId),
      getMonthlyBookingStats(db, storeId, monthRange),
      getNationalityMix(db, storeId, monthRange),
    ]);
    return {
      inbox,
      dispute,
      kyc,
      serviceCounts,
      staffCounts,
      servicesList,
      staffList,
      bookingStats,
      nationalityMix,
    };
  },
  ["store-dashboard-v1"],
  {
    revalidate: 30,
    tags: ["bookings", "conversations", "disputes", "services", "staff"],
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

  const monthRange = getCurrentMonthRange();
  const monthKey = `${monthRange.fromDate.toISOString()}|${monthRange.toDate.toISOString()}`;

  // shell은 세션 의존 (사용자별) — 캐시 X. 나머지 9 DAL은 storeId+month 캐시.
  const [cached, shell] = await Promise.all([
    getStoreDashboardCached(session.storeId, monthKey),
    getOwnerShellData(),
  ]);
  const {
    inbox,
    dispute,
    kyc,
    serviceCounts,
    staffCounts,
    servicesList,
    staffList,
    bookingStats,
    nationalityMix,
  } = cached;

  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const kycLabel = t(`kycStates.${kyc}` as const);

  const serviceNameMap = new Map(
    servicesList.map((s) => [s.id, s.nameKo] as const),
  );
  const staffNameMap = new Map(staffList.map((s) => [s.id, s.name] as const));

  const treatmentSlices: ReadonlyArray<DistributionSlice> = serviceCounts.map(
    (c) => ({ label: serviceNameMap.get(c.key) ?? "—", value: c.count }),
  );
  const designerSlices: ReadonlyArray<DistributionSlice> = staffCounts.map(
    (c) => ({ label: staffNameMap.get(c.key) ?? "—", value: c.count }),
  );

  const treatmentTotal = treatmentSlices.reduce((sum, s) => sum + s.value, 0);
  const designerTotal = designerSlices.reduce((sum, s) => sum + s.value, 0);

  // M3.4/Epic 4 — 국적 분포 donut slices (top 6 + "기타")
  const TOP_N = 6;
  const nationalitySlices: ReadonlyArray<DistributionSlice> = (() => {
    if (nationalityMix.length <= TOP_N) {
      return nationalityMix.map((r) => ({
        label: r.nationality.toUpperCase(),
        value: r.count,
      }));
    }
    const head = nationalityMix.slice(0, TOP_N - 1);
    const tail = nationalityMix.slice(TOP_N - 1);
    const tailSum = tail.reduce((s, r) => s + r.count, 0);
    return [
      ...head.map((r) => ({
        label: r.nationality.toUpperCase(),
        value: r.count,
      })),
      { label: t("kpis.otherNationality"), value: tailSum },
    ];
  })();
  const nationalityTotal = nationalitySlices.reduce(
    (sum, s) => sum + s.value,
    0,
  );

  const monthlyRevenue: KpiEntry = {
    key: "monthlyRevenue",
    label: t("kpis.monthlyRevenue"),
    value: bookingStats.revenueKrw.toLocaleString("ko"),
    unit: t("units.won"),
    state: "active",
    subtext: `${bookingStats.bookingCount} ${t("units.count")}`,
  };
  const inboxUnread: KpiEntry = {
    key: "inboxUnread",
    label: t("kpis.inboxUnread"),
    value: String(inbox.unreadMessages),
    unit: t("units.count"),
    state: "active",
    subtext: `${inbox.openThreads} ${t("kpis.inboxThreads")}`,
  };
  const disputesActive: KpiEntry = {
    key: "disputesActive",
    label: t("kpis.disputesActive"),
    value: String(dispute.active),
    unit: t("units.count"),
    state: "active",
    subtext:
      dispute.slaExceeded > 0
        ? `${t("kpis.disputesSla")}: ${dispute.slaExceeded}`
        : undefined,
  };
  const nationalityMixEntry: KpiEntry = {
    key: "nationalityMix",
    label: t("kpis.nationalityMix"),
    value: String(nationalityTotal),
    unit: t("units.count"),
    state: nationalityTotal > 0 ? "active" : "coming-soon",
    chart:
      nationalityTotal > 0 ? (
        <DistributionPie data={nationalitySlices} />
      ) : undefined,
  };
  const treatmentMix: KpiEntry = {
    key: "treatmentMix",
    label: t("kpis.treatmentMix"),
    value: String(treatmentTotal),
    unit: t("units.count"),
    state: "active",
    chart: <DistributionPie data={treatmentSlices} />,
  };
  const designerMix: KpiEntry = {
    key: "designerMix",
    label: t("kpis.designerMix"),
    value: String(designerTotal),
    unit: t("units.count"),
    state: "active",
    chart: <DistributionPie data={designerSlices} />,
  };
  const noShowRate: KpiEntry = {
    key: "noShowRate",
    label: t("kpis.noShowRate"),
    value: String(bookingStats.noShowRatePct),
    unit: t("units.percent"),
    state: bookingStats.bookingCount > 0 ? "active" : "coming-soon",
    subtext:
      bookingStats.noShowCount > 0
        ? `${bookingStats.noShowCount} ${t("units.count")}`
        : undefined,
  };
  const averageOrder: KpiEntry = {
    key: "averageOrder",
    label: t("kpis.averageOrder"),
    value:
      bookingStats.bookingCount > 0
        ? bookingStats.averageOrderKrw.toLocaleString("ko")
        : "—",
    unit: t("units.won"),
    state: bookingStats.bookingCount > 0 ? "active" : "coming-soon",
  };
  const rebookRate: KpiEntry = {
    key: "rebookRate",
    label: t("kpis.rebookRate"),
    value: "—",
    unit: t("units.percent"),
    state: "coming-soon",
  };
  const kycStatus: KpiEntry = {
    key: "kycStatus",
    label: t("kpis.kycStatus"),
    value: kycLabel,
    state: "active",
  };

  // M6.2c — reference bento layout (3 rows):
  // Row 1 (.sd-row-2 1.6fr:1fr:1fr): featured revenue + ops (inbox / disputes)
  // Row 2 (.sd-bento-3 1.15fr:1fr:1fr): customer mix donuts
  // Row 3 (uniform 4-col): secondary KPIs
  const rowHero: ReadonlyArray<KpiEntry> = [
    monthlyRevenue,
    inboxUnread,
    disputesActive,
  ];
  const rowMix: ReadonlyArray<KpiEntry> = [
    nationalityMixEntry,
    treatmentMix,
    designerMix,
  ];
  const rowSecondary: ReadonlyArray<KpiEntry> = [
    noShowRate,
    averageOrder,
    rebookRate,
    kycStatus,
  ];

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
        <div className="space-y-4">
          <KpiGrid
            entries={rowHero}
            comingSoonNote={t("comingSoonNote")}
            testId="kpi-grid-hero"
            className="grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr_1fr]"
          />
          <KpiGrid
            entries={rowMix}
            comingSoonNote={t("comingSoonNote")}
            testId="kpi-grid-mix"
            className="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_1fr_1fr]"
          />
          <KpiGrid
            entries={rowSecondary}
            comingSoonNote={t("comingSoonNote")}
            testId="kpi-grid-secondary"
          />
        </div>
        <p className="mt-8 font-mono text-[11px] text-hesya-navy-900/55">
          {t("footerNote")}
        </p>
      </div>
    </div>
  );
}
