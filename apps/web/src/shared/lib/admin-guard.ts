import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";

export type AdminGuardResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; error: "unauthorized" | "forbidden"; message: string };

/**
 * Server Component / Server Action에서 운영자(admin) 권한 강제.
 *
 * Better Auth 세션을 가져온 뒤 `ADMIN_EMAILS` env 화이트리스트와 매칭.
 * Epic 12 admin panel 도입 시 정식 owner guard로 교체 예정.
 *
 * **E2E/데모 bypass**: `NODE_ENV !== "production"`이고 `E2E_ADMIN_EMAIL`이
 * 설정된 경우, Better Auth 세션 + ADMIN_EMAILS 화이트리스트 검증을 우회하고
 * 해당 email + `E2E_AUTH_USER_ID`를 admin으로 즉시 승인. `pnpm dev:demo`
 * 또는 Playwright E2E 전용. prod NODE_ENV에서는 절대 작동하지 않음
 * (단위 테스트로 prod 차단 검증).
 */
export async function requireAdminEmail(): Promise<AdminGuardResult> {
  // E2E/데모 bypass — prod에서는 절대 작동 안 함.
  // store-owner-guard.ts와 동일 패턴 (NODE_ENV + 전용 env 두 조건 동시 만족).
  if (env.NODE_ENV !== "production" && process.env.E2E_ADMIN_EMAIL) {
    const userId = process.env.E2E_AUTH_USER_ID;
    if (!userId) {
      return {
        ok: false,
        error: "unauthorized",
        message: "E2E_ADMIN_EMAIL set but E2E_AUTH_USER_ID missing",
      };
    }
    return {
      ok: true,
      userId,
      email: process.env.E2E_ADMIN_EMAIL.toLowerCase(),
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { ok: false, error: "unauthorized", message: "로그인이 필요합니다" };
  }
  const email = session.user.email?.toLowerCase();
  const allowList = env.ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && allowList.includes(email)) {
    return { ok: true, userId: session.user.id, email };
  }
  return { ok: false, error: "forbidden", message: "관리자 권한이 필요합니다" };
}
