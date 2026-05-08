/**
 * admin-guard TDD — RED 단계.
 *
 * `requireAdminEmail()` 동작 명세:
 * 1. Better Auth session 없음 → { ok: false, error: "unauthorized" }
 * 2. session 있지만 email이 ADMIN_EMAILS 화이트리스트에 없음 → { ok: false, error: "forbidden" }
 * 3. session 있고 email이 화이트리스트에 있음 → { ok: true, userId, email }
 * 4. ADMIN_EMAILS 파싱: 콤마 분리, trim, 대소문자 무시, 공백 항목 무시
 *
 * Better Auth(`auth.api.getSession`)와 env(`ADMIN_EMAILS`)를 mock.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/shared/config/env", () => ({
  env: { ADMIN_EMAILS: "", NODE_ENV: "test" },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { requireAdminEmail } from "./admin-guard";

const getSessionMock = vi.mocked(auth.api.getSession);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.E2E_ADMIN_EMAIL;
  delete process.env.E2E_AUTH_USER_ID;
});

describe("requireAdminEmail", () => {
  it("session이 없으면 unauthorized 반환", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    env.ADMIN_EMAILS = "jayden@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(result.message).toMatch(/로그인/);
  });

  it("session은 있지만 email이 화이트리스트에 없으면 forbidden 반환", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-1", email: "stranger@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    env.ADMIN_EMAILS = "jayden@example.com,ops@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("forbidden");
    expect(result.message).toMatch(/관리자/);
  });

  it("화이트리스트에 있는 email이면 ok 반환", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-1", email: "jayden@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    env.ADMIN_EMAILS = "jayden@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe("u-1");
    expect(result.email).toBe("jayden@example.com");
  });

  it("ADMIN_EMAILS 파싱: 대소문자 무시 + 공백 trim + 빈 항목 무시", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-2", email: "Jayden@Example.COM" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    env.ADMIN_EMAILS = "  ops@example.com , JAYDEN@example.com ,, ";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.email).toBe("jayden@example.com");
  });

  it("session.user.email이 누락되면 forbidden 반환", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-3" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    env.ADMIN_EMAILS = "jayden@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("forbidden");
  });
});

describe("requireAdminEmail — E2E/데모 bypass", () => {
  it("NODE_ENV=development + E2E_ADMIN_EMAIL + E2E_AUTH_USER_ID set → ok (Better Auth 우회)", async () => {
    env.NODE_ENV = "development";
    process.env.E2E_ADMIN_EMAIL = "demo-owner@hesya.local";
    process.env.E2E_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe("00000000-0000-0000-0000-000000000001");
    expect(result.email).toBe("demo-owner@hesya.local");
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("NODE_ENV=production이면 bypass 무시 (prod 차단)", async () => {
    env.NODE_ENV = "production";
    process.env.E2E_ADMIN_EMAIL = "demo-owner@hesya.local";
    process.env.E2E_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";
    getSessionMock.mockResolvedValueOnce(null);
    env.ADMIN_EMAILS = "real-admin@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(getSessionMock).toHaveBeenCalled();
  });

  it("E2E_ADMIN_EMAIL set + E2E_AUTH_USER_ID 미set → unauthorized (잘못된 환경 검출)", async () => {
    env.NODE_ENV = "development";
    process.env.E2E_ADMIN_EMAIL = "demo-owner@hesya.local";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("E2E_ADMIN_EMAIL 미set이면 정상 Better Auth 흐름", async () => {
    env.NODE_ENV = "development";
    getSessionMock.mockResolvedValueOnce(null);
    env.ADMIN_EMAILS = "real-admin@example.com";

    const result = await requireAdminEmail();

    expect(result.ok).toBe(false);
    expect(getSessionMock).toHaveBeenCalled();
  });
});

describe("admin-guard.ts (boundary)", () => {
  it("첫 줄에 server-only import — 클라이언트 번들 유출 방지", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/admin-guard.ts", "utf-8");
    expect(src.split("\n")[0]).toBe('import "server-only";');
  });
});
