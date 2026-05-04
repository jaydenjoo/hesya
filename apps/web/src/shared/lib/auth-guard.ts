/**
 * Server Action 인증 헬퍼 (Next.js 16.2 권고 패턴)
 *
 * 사용:
 *   'use server'
 *   import { requireAuth } from '@/shared/lib/auth-guard'
 *
 *   export async function deleteProject(id: string) {
 *     const session = await requireAuth()  // ← 첫 줄
 *     // ...
 *   }
 *
 * 규칙:
 * - 모든 Server Action 첫 줄에 호출
 * - middleware 의존 금지 (각 액션 자체 검증 — Next.js 권고)
 */

export interface Session {
  userId: string;
  email: string;
  role?: "admin" | "user";
}

import { UnauthorizedError } from "./errors";
export { UnauthorizedError };

/**
 * 인증 확인. 비로그인 시 UnauthorizedError 던짐.
 *
 * TODO: Supabase 사용 시 createClient + getUser()로 교체
 */
export async function requireAuth(): Promise<Session> {
  // Supabase 예시 (사용 시 주석 해제):
  //
  // import { createClient } from "@/shared/lib/supabase/server";
  // const supabase = await createClient();
  // const { data: { user }, error } = await supabase.auth.getUser();
  // if (error || !user) throw new UnauthorizedError();
  // return { userId: user.id, email: user.email! };

  // 임시 stub — 실제 인증 로직으로 교체 필요
  throw new UnauthorizedError(
    "auth-guard.ts에 실제 인증 로직 구현 필요 (Supabase/NextAuth 등)",
  );
}

/**
 * 관리자 권한 확인.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== "admin") {
    throw new UnauthorizedError("관리자 권한 필요");
  }
  return session;
}
