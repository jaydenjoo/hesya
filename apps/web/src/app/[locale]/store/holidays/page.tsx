import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

import { HolidaysView } from "./HolidaysView";
import "./holidays.css";

/**
 * /[locale]/store/holidays — 매장 휴무일 관리.
 * Reference: docs/design/reference/Hesya Store Holidays.html
 *
 * 베타: 한국 공휴일 자동 mock 8개 + 직접 추가 in-memory.
 * 추후 store_holidays 테이블 + DAL 도입 시 server-side로.
 */

export const metadata: Metadata = {
  title: "휴무일 관리 · Hesya Store",
  description: "매장 휴무일과 한국 공휴일을 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function StoreHolidaysPage({
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
  return <HolidaysView />;
}
