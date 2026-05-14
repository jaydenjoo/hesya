/**
 * Plan v4 Epic B — AI Photo Analysis 페이지.
 *
 * 외국인 손님이 원하는 K-beauty 스타일 사진을 업로드 → Claude Opus 4.7 Vision
 * 분석 결과 표시. 인증 불요 (anonymous 가능). rate-limit으로 abuse 방지.
 *
 * 디자인 ref: docs/design/reference/ai-flow-app.jsx.
 * 라우트: /c/photo-analyze.
 */

import { setRequestLocale, getTranslations } from "next-intl/server";

import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import {
  PhotoAnalyzeFlow,
  type PhotoAnalyzeLabels,
} from "@/features/photo-analyze/photo-analyze-flow";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PhotoAnalyzePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PhotoAnalyze" });

  const labels: PhotoAnalyzeLabels = {
    back: t("back"),
    title: t("title"),
    dropHint: t("dropHint"),
    cameraButton: t("cameraButton"),
    libraryButton: t("libraryButton"),
    privacy: t("privacy"),
    analyzing: {
      reading: t("analyzing.reading"),
      matching: t("analyzing.matching"),
      capability: t("analyzing.capability"),
      done: t("analyzing.done"),
      encourage: t("analyzing.encourage"),
      poweredBy: t("analyzing.poweredBy"),
    },
    result: {
      heading: t("result.heading"),
      styleLabel: t("result.styleLabel"),
      difficultyLabel: t("result.difficultyLabel"),
      difficultyEasy: t("result.difficultyEasy"),
      difficultyMedium: t("result.difficultyMedium"),
      difficultyHard: t("result.difficultyHard"),
      timeLabel: t("result.timeLabel"),
      timeMinutes: t("result.timeMinutes"),
      compatibilityLabel: t("result.compatibilityLabel"),
      confidenceLabel: t("result.confidenceLabel"),
      retryButton: t("result.retryButton"),
      disclaimer: t("result.disclaimer"),
    },
    errors: {
      tooLarge: t("errors.tooLarge"),
      invalidType: t("errors.invalidType"),
      rateLimited: t("errors.rateLimited"),
      visionFailed: t("errors.visionFailed"),
      generic: t("errors.generic"),
    },
  };

  return (
    <CustomerFrame>
      <PhotoAnalyzeFlow labels={labels} />
    </CustomerFrame>
  );
}
