import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { findByUserId } from "./dal/store-owners";
import { ForbiddenError, UnauthorizedError } from "./errors";

export interface StoreOwnerSession {
  userId: string;
  storeId: string;
  role: "owner" | "manager";
}

/**
 * Server Component / Server Action에서 매장 소유자 권한 강제.
 *
 * Better Auth 세션을 가져온 뒤 `store_owners` DAL로 owner ↔ store 매칭 확인.
 * 1A는 application-level 강제 (DB RLS 정책은 미래 대비 작성됨).
 *
 * **E2E bypass**: `NODE_ENV !== "production"`이고 `E2E_AUTH_USER_ID`가 설정된 경우,
 * Better Auth 세션 검증을 우회하고 해당 user_id로 직접 DAL 조회. Playwright E2E 전용.
 * prod NODE_ENV에서는 절대 작동하지 않으며, 단위 테스트로 prod 차단 검증됨.
 *
 * `React.cache()` wrap — 동일 request 내 중복 호출 dedup (layout + page 양쪽 호출).
 *
 * @throws UnauthorizedError 세션 없음 (401)
 * @throws ForbiddenError 세션은 있으나 매장 소유자 아님 (403)
 */
export const requireStoreOwnerAuth = cache(
  async (): Promise<StoreOwnerSession> => {
    const db = createDbClient(env.DATABASE_URL);

    // E2E bypass — prod에서는 절대 작동 안 함.
    if (env.NODE_ENV !== "production" && process.env.E2E_AUTH_USER_ID) {
      const userId = process.env.E2E_AUTH_USER_ID;
      const ownership = await findByUserId(db, userId);
      if (!ownership) {
        throw new ForbiddenError("매장 소유자 권한이 없습니다");
      }
      return { userId, storeId: ownership.storeId, role: ownership.role };
    }

    // Plan v3 M5.1 — Vercel preview demo bypass. VERCEL_ENV='preview' + DEMO_USER_ID
    // 동시 설정 시 자동 owner 로그인. prod (VERCEL_ENV='production')에선 차단.
    // 외부 데모 URL 1개를 인증 없이 시연 가능하게 함.
    if (env.VERCEL_ENV === "preview" && env.DEMO_USER_ID) {
      const ownership = await findByUserId(db, env.DEMO_USER_ID);
      if (ownership) {
        return {
          userId: env.DEMO_USER_ID,
          storeId: ownership.storeId,
          role: ownership.role,
        };
      }
      // 매장 소속 못 찾으면 일반 흐름으로 (preview에서도 미시드 user는 sign-in으로).
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new UnauthorizedError("로그인이 필요합니다");
    }

    const ownership = await findByUserId(db, session.user.id);
    if (!ownership) {
      throw new ForbiddenError("매장 소유자 권한이 없습니다");
    }

    return {
      userId: session.user.id,
      storeId: ownership.storeId,
      role: ownership.role,
    };
  },
);
