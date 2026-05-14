/**
 * Plan v3 M3.4 — customer MyPage.
 *
 * 외국인 손님 마이페이지. magic link 인증 필수 — 미인증 시 /c/sign-in으로 redirect.
 * 4개 탭: Upcoming / Past / Saved / Reviews.
 *
 * 데이터 로딩은 서버 측에서 4개 DAL 호출 → tabs Client 컴포넌트로 props 주입.
 * tab 전환은 클라이언트 useState (URL 쿼리 ?tab=... 분기 안 함 — 단일 페이지).
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { MyPageTabs } from "@/features/customer-mypage/my-page-tabs";
import {
  mockCustomerProfile,
  mockMiniTimeline,
  mockPastBookings,
  mockPendingReviews,
  mockPerks,
  mockSavedStores,
  mockUpcomingBookings,
} from "@/lib/mock-fixtures/mypage";
import { env } from "@/shared/config/env";
import { requireCustomerAuth } from "@/shared/lib/customer-guard";
import {
  listPastBookings,
  listPendingReviewBookings,
  listSavedStoresByCustomer,
  listUpcomingBookings,
} from "@/shared/lib/dal/customer-mypage";
import { UnauthorizedError } from "@/shared/lib/errors";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CustomerMyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let session;
  try {
    session = await requireCustomerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect(`/${locale}/c/sign-in`);
    }
    throw err;
  }

  const t = await getTranslations({ locale, namespace: "CustomerMyPage" });
  const db = createDbClient(env.DATABASE_URL);

  const [realUpcoming, realPast, realSaved, realPendingReviews] =
    await Promise.all([
      listUpcomingBookings(db, session.customerId),
      listPastBookings(db, session.customerId),
      listSavedStoresByCustomer(db, session.customerId),
      listPendingReviewBookings(db, session.customerId),
    ]);

  // Sprint 2A: MOCK_FIXTURES=true + 실 데이터 비어있을 때만 rich mock fallback.
  // 외부 데모 (preview/베타) 시연용. prod 실 매장 매칭 후 자동 끝.
  const useFixtures = env.MOCK_FIXTURES;
  const upcoming =
    useFixtures && realUpcoming.length === 0
      ? [...mockUpcomingBookings]
      : realUpcoming;
  const past =
    useFixtures && realPast.length === 0 ? [...mockPastBookings] : realPast;
  const saved =
    useFixtures && realSaved.length === 0 ? [...mockSavedStores] : realSaved;
  const pendingReviews =
    useFixtures && realPendingReviews.length === 0
      ? [...mockPendingReviews]
      : realPendingReviews;

  // Header traveler 정보 — useFixtures 시 mock profile, 아니면 session name만.
  const displayName = useFixtures
    ? mockCustomerProfile.displayName
    : session.name?.trim() || t("defaultName");
  const travelerInfo = useFixtures
    ? {
        flag: mockCustomerProfile.flag,
        locale: mockCustomerProfile.locale,
        hometown: mockCustomerProfile.hometown,
        tripLabel: mockCustomerProfile.tripLabel,
      }
    : null;

  return (
    <CustomerFrame>
      <div className="px-5 pb-8 pt-6">
        <header className="mb-5 flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-hesya-amber-200 to-hesya-amber-600 text-[18px] font-semibold text-hesya-navy-900"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-[22px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
              {t("greeting", { name: displayName })}
            </h1>
            {travelerInfo ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-hesya-navy-900/55">
                <span>
                  <span aria-hidden="true" className="mr-0.5">
                    {travelerInfo.flag}
                  </span>
                  {travelerInfo.locale}
                </span>
                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>
                <span>📍 {travelerInfo.hometown}</span>
                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>
                <span>✈️ {travelerInfo.tripLabel}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
                {session.email}
              </p>
            )}
          </div>
        </header>

        <MyPageTabs
          locale={locale}
          miniTimeline={useFixtures ? [...mockMiniTimeline] : null}
          perks={useFixtures ? { ...mockPerks } : null}
          labels={{
            tabs: {
              upcoming: t("tabs.upcoming"),
              past: t("tabs.past"),
              saved: t("tabs.saved"),
              reviews: t("tabs.reviews"),
            },
            empty: {
              upcoming: t("empty.upcoming"),
              past: t("empty.past"),
              saved: t("empty.saved"),
              reviews: t("empty.reviews"),
            },
            actions: {
              bookAgain: t("actions.bookAgain"),
              viewStore: t("actions.viewStore"),
              signOut: t("actions.signOut"),
              unsave: t("actions.unsave"),
            },
            review: {
              // next-intl ICU `{store}`는 호출 시점에 채워야 하나 Client에서
              // 카드별로 replace. raw로 가져와서 template 그대로 전달.
              question: t.raw("review.question") as string,
              placeholder: t("review.placeholder"),
              submit: t("review.submit"),
              languageNote: t("review.languageNote"),
              skipAll: t("review.skipAll"),
            },
            upcomingExtras: useFixtures
              ? {
                  showQr: t("upcoming.showQr"),
                  directions: t("upcoming.directions"),
                  chat: t("upcoming.chat"),
                  reminder: t("upcoming.reminder"),
                  modify: t("upcoming.modify"),
                  cancel: t("upcoming.cancel"),
                }
              : undefined,
            perks: useFixtures
              ? {
                  title: t("perks.title", {
                    count: mockPerks.completedCount,
                  }),
                  subtitle: t("perks.subtitle", {
                    percent: mockPerks.discountPercent,
                  }),
                  footer: t("perks.footer", {
                    done: mockPerks.completedCount,
                    target: mockPerks.targetCount,
                    remaining: mockPerks.targetCount - mockPerks.completedCount,
                  }),
                }
              : undefined,
          }}
          data={{
            upcoming,
            past,
            saved,
            pendingReviews,
          }}
        />
      </div>
    </CustomerFrame>
  );
}
