import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

import { BasicView } from "./BasicView";
import "./basic.css";

/**
 * /[locale]/store/settings/basic — 매장 기본 정보 관리.
 * Reference: docs/design/reference/Hesya Store Settings Basic.html
 *
 * 베타: 식별/주소/사진/소개 4 섹션. in-memory state.
 * 추후 store_basic save Server Action 도입 시 server-side로.
 */

export const metadata: Metadata = {
  title: "기본 정보 · Hesya Store",
  description: "매장 식별, 주소, 사진, 소개를 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function StoreSettingsBasicPage({
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
  return <BasicView />;
}
