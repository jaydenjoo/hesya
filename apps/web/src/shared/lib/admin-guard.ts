import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";

export type AdminGuardResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; error: "unauthorized" | "forbidden"; message: string };

export async function requireAdminEmail(): Promise<AdminGuardResult> {
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
