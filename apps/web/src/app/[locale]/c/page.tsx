/**
 * Plan v3 M4.5 — customer 랜딩 페이지.
 *
 * 외국인 손님 첫 진입점. 매장 검색 + region chip 필터 + store card grid.
 *
 * 축소 scope (베타 핵심):
 *   - 매장 검색 (이름/지역 ilike) + region chip 필터 + 매장 카드 + 매장 진입
 *   - 인증 분기 (로그인 시 mypage button, 미로그인 시 sign-in button)
 *
 * 보류 (Phase 2):
 *   - AI photo upload, UGC wall, trending searches, reviews carousel.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { listPublicStores } from "@/shared/lib/dal/stores";
import { CustomerLanding } from "@/features/customer-landing/customer-landing";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ region?: string; q?: string }>;
}

const REGIONS = [
  "Seoul",
  "Busan",
  "Jeju",
  "Gangnam",
  "Hongdae",
  "Myeongdong",
  "Seongsu",
  "Apgujeong",
] as const;

export default async function CustomerLandingPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { region, q } = await searchParams;

  const db = createDbClient(env.DATABASE_URL);
  const stores = await listPublicStores(db, {
    region: region?.trim() || undefined,
    search: q?.trim() || undefined,
    limit: 24,
  });

  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  const isAuthed = Boolean(session?.user?.email);

  const t = await getTranslations({ locale, namespace: "CustomerLanding" });

  return (
    <CustomerLanding
      locale={locale}
      isAuthed={isAuthed}
      initialRegion={region?.trim() ?? ""}
      initialSearch={q?.trim() ?? ""}
      stores={stores}
      regions={[...REGIONS]}
      labels={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        searchPlaceholder: t("searchPlaceholder"),
        regionLabel: t("regionLabel"),
        regionAll: t("regionAll"),
        // next-intl 4.x: ICU `{n}` 변수는 t() 호출 시점에 채워야 함 (manual replace 안 됨).
        resultsCount: t("resultsCount", { n: stores.length }),
        emptyTitle: t("emptyTitle"),
        emptySubtitle: t("emptySubtitle"),
        signIn: t("signIn"),
        mypage: t("mypage"),
        viewStore: t("viewStore"),
      }}
    />
  );
}
