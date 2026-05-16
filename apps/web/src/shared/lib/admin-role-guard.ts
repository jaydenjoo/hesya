import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { findRoleByUserId } from "./dal/users";

export type AdminRoleGuardResult =
  | { ok: true; userId: string; role: "admin" }
  | { ok: false; error: "unauthorized" | "forbidden"; message: string };

/**
 * Epic 12-α — DB role 기반 admin 가드.
 *
 * `requireAdminEmail` (ADMIN_EMAILS env 화이트리스트, 첫 운영자 임시 솔루션)의
 * 후속 정식 가드. Better Auth 세션 → `users.role === 'admin'` 확인. 0030 마이그
 * 적용 후 사용 가능.
 *
 * **본 PR의 scope**: 함수 정의 + 단위 테스트만. 22개의 `requireAdminEmail` 호출처
 * 마이그는 별도 PR (Phase 1-γ.2+) — 4원칙 3번 (외과적 변경).
 *
 * **E2E/데모 bypass**: `requireAdminEmail`과 동일 패턴 — `NODE_ENV !== "production"`
 * 이고 `E2E_ADMIN_EMAIL` + `E2E_AUTH_USER_ID`가 설정된 경우, Better Auth 세션
 * 및 DB 조회를 우회하고 즉시 admin 승인. prod에서는 절대 작동하지 않음.
 *
 * Return shape: `requireAdminEmail`과 동일 envelope ({ ok: true | false }). 호출처가
 * 두 함수 사이 점진 교체 가능하게 동일 union 유지.
 *
 * `React.cache()` wrap — 동일 request 내 중복 호출 dedup.
 */
export const requireAdminRole = cache(
  async (): Promise<AdminRoleGuardResult> => {
    // E2E/데모 bypass — prod에서는 절대 작동 안 함.
    if (env.NODE_ENV !== "production" && process.env.E2E_ADMIN_EMAIL) {
      const userId = process.env.E2E_AUTH_USER_ID;
      if (!userId) {
        return {
          ok: false,
          error: "unauthorized",
          message: "E2E_ADMIN_EMAIL set but E2E_AUTH_USER_ID missing",
        };
      }
      return { ok: true, userId, role: "admin" };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return {
        ok: false,
        error: "unauthorized",
        message: "로그인이 필요합니다",
      };
    }

    // 0030 마이그 미적용 환경에서 SQL error → unauthorized로 fail-safe.
    let dbResult: { role: "user" | "admin" } | null;
    try {
      const db = createDbClient(env.DATABASE_URL);
      dbResult = await findRoleByUserId(db, session.user.id);
    } catch (err) {
      console.error(
        `[admin-role-guard] users.role lookup failed (userId=${session.user.id}):`,
        err,
      );
      return {
        ok: false,
        error: "unauthorized",
        message: "권한 확인에 실패했습니다",
      };
    }

    if (!dbResult || dbResult.role !== "admin") {
      return {
        ok: false,
        error: "forbidden",
        message: "관리자 권한이 필요합니다",
      };
    }

    return { ok: true, userId: session.user.id, role: "admin" };
  },
);
