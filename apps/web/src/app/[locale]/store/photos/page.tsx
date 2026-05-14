import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  PhotoBoard,
  type PhotoBoardLabels,
} from "@/features/photo-board/photo-board";
import { mockPhotos, mockPhotoStats } from "@/lib/mock-fixtures/photos";
import { env } from "@/shared/config/env";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Sprint 2C PR-C4 — Owner /store/photos AI Photos 페이지.
 *
 * env.MOCK_FIXTURES=false 일 때는 "준비 중" 안내 (실 DAL은 Epic B 정식 도입 후).
 * env.MOCK_FIXTURES=true 일 때만 18장 mock + 필터/상세 패널 렌더.
 *
 * Reference: docs/design/reference/store-photos.jsx (12장 → 18장 확장).
 */

export default async function StorePhotosPage({
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

  const t = await getTranslations("OwnerPhotos");

  const labels: PhotoBoardLabels = {
    filterLatest: t("filterLatest"),
    filterFailed: t("filterFailed"),
    filterVip: t("filterVip"),
    gridCount: t("gridCount"),
    avgConfidence: t("avgConfidence"),
    toggleGrid: t("toggleGrid"),
    toggleList: t("toggleList"),
    statusBooked: t("statusBooked"),
    statusReview: t("statusReview"),
    statusFailed: t("statusFailed"),
    photoLabel: t("photoLabel"),
    photoMeta: t("photoMeta"),
    scoreLabel: t("scoreLabel"),
    auditTitle: t("auditTitle"),
    auditTag: t("auditTag"),
    auditThicknessLabel: t("auditThicknessLabel"),
    auditThicknessVal: t("auditThicknessVal"),
    auditTechLabel: t("auditTechLabel"),
    auditTechSub: t("auditTechSub"),
    auditPortfolioLabel: t("auditPortfolioLabel"),
    auditPortfolioSub: t("auditPortfolioSub"),
    failedHeading: t("failedHeading"),
    failedBody: t("failedBody"),
    failedPhotoQuality: t("failedPhotoQuality"),
    failedRequestMatch: t("failedRequestMatch"),
    failedStylistMatch: t("failedStylistMatch"),
    close: t("close"),
    noStylist: t("noStylist"),
    designerSuffix: t("designerSuffix"),
  };

  return (
    <div className="bg-hesya-peach-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-[28px] italic tracking-tight text-hesya-navy-900">
              {t("title")}
            </h1>
            <p className="text-[13px] text-hesya-navy-900/65 [word-break:keep-all]">
              {t("subtitle")}
            </p>
          </div>
          {env.MOCK_FIXTURES && (
            <div className="flex flex-wrap items-baseline gap-4 text-[12px] text-hesya-navy-900/70">
              <span>
                {t("weekTotal")}{" "}
                <strong className="font-mono text-hesya-navy-900">
                  {mockPhotoStats.weekTotal}
                </strong>
                {t("countSuffix")}
              </span>
              <span className="h-3 w-px bg-hesya-navy-900/12" />
              <span>
                {t("weekMatched")}{" "}
                <strong className="font-mono text-hesya-navy-900">
                  {mockPhotoStats.weekMatched}
                </strong>
                {t("countSuffix")}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700">
                {mockPhotoStats.weekMatchRate}%
              </span>
            </div>
          )}
        </header>

        {env.MOCK_FIXTURES ? (
          <PhotoBoard
            photos={mockPhotos}
            labels={labels}
            counts={{
              latest: mockPhotoStats.weekTotal,
              failed: mockPhotoStats.failedCount,
              vip: mockPhotoStats.vipCount,
              avgConfidence: mockPhotoStats.avgConfidence,
            }}
          />
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-hesya-navy-900/8">
            <p className="font-display text-[18px] italic text-hesya-navy-900">
              {t("comingSoonTitle")}
            </p>
            <p className="mt-2 text-[13px] text-hesya-navy-900/60 [word-break:keep-all]">
              {t("comingSoonBody")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
