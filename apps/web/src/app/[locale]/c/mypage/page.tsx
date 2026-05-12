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

  const [upcoming, past, saved, pendingReviews] = await Promise.all([
    listUpcomingBookings(db, session.customerId),
    listPastBookings(db, session.customerId),
    listSavedStoresByCustomer(db, session.customerId),
    listPendingReviewBookings(db, session.customerId),
  ]);

  const displayName = session.name?.trim() || t("defaultName");

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
            <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
              {session.email}
            </p>
          </div>
        </header>

        <MyPageTabs
          locale={locale}
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
              question: t("review.question"),
              placeholder: t("review.placeholder"),
              submit: t("review.submit"),
              languageNote: t("review.languageNote"),
              skipAll: t("review.skipAll"),
            },
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
