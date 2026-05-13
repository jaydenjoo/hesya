import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { createDbClient } from "@hesya/database";

import { findByUserId } from "@/shared/lib/dal/store-owners";
import { getStoreSettings } from "@/shared/lib/dal/stores";

/**
 * Plan v3 Phase D1-A1 — Owner Shell 페이지가 필요한 컨텍스트를 한 번에 조회.
 * `requireStoreOwnerAuth`와 별도 (auth check + user 정보 + storeName 단일 round).
 *
 * 사용처: store/layout.tsx + 페이지 내부 (DashboardHeader 등)에서 storeName 사용 시.
 * 인증 실패는 caller가 redirect (이 함수는 null 반환).
 *
 * `React.cache()` wrap — 동일 request 내 중복 호출 dedup (layout + page 양쪽 호출).
 */
export const getOwnerShellData = cache(
  async (): Promise<{
    storeId: string;
    storeName: string;
    userName: string;
    userInitial: string;
  } | null> => {
    const db = createDbClient(env.DATABASE_URL);

    // E2E bypass — store-owner-guard와 동일 정책 (prod 차단)
    if (env.NODE_ENV !== "production" && process.env.E2E_AUTH_USER_ID) {
      const userId = process.env.E2E_AUTH_USER_ID;
      const ownership = await findByUserId(db, userId);
      if (!ownership) return null;
      const settings = await getStoreSettings(db, ownership.storeId);
      if (!settings) return null;
      return {
        storeId: ownership.storeId,
        storeName: settings.name,
        userName: "E2E",
        userInitial: "E",
      };
    }

    // Plan v3 M5.1 — Vercel preview demo bypass. requireStoreOwnerAuth와 동일 패턴.
    // VERCEL_ENV='preview' + DEMO_USER_ID 설정 시 Better Auth session 없이 통과.
    // prod (VERCEL_ENV='production')에선 분기 자체 미진입.
    if (env.VERCEL_ENV === "preview" && env.DEMO_USER_ID) {
      const ownership = await findByUserId(db, env.DEMO_USER_ID);
      if (!ownership) return null;
      const settings = await getStoreSettings(db, ownership.storeId);
      if (!settings) return null;
      return {
        storeId: ownership.storeId,
        storeName: settings.name,
        userName: "데모 사장",
        userInitial: "데",
      };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;

    const ownership = await findByUserId(db, session.user.id);
    if (!ownership) return null;

    const settings = await getStoreSettings(db, ownership.storeId);
    if (!settings) return null;

    const userName = session.user.name || session.user.email || "Owner";
    const userInitial = (userName.trim()[0] ?? "O").toUpperCase();

    return {
      storeId: ownership.storeId,
      storeName: settings.name,
      userName,
      userInitial,
    };
  },
);
