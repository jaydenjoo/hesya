/**
 * admin-role-guard 단위 테스트 — Epic 12-α.
 *
 * `requireAdminRole()` 동작 명세:
 * 1. Better Auth session 없음 → { ok: false, error: "unauthorized" }
 * 2. session 있지만 users row 없음 → { ok: false, error: "forbidden" }
 * 3. session 있고 role='user' → { ok: false, error: "forbidden" }
 * 4. session 있고 role='admin' → { ok: true, userId, role: "admin" }
 * 5. DB 조회 throws (예: 0030 마이그 미적용) → { ok: false, error: "unauthorized" } (fail-safe)
 * 6. E2E bypass: NODE_ENV !== "production" + E2E_ADMIN_EMAIL + E2E_AUTH_USER_ID → ok
 * 7. NODE_ENV="production"이면 bypass 무시 (prod 차단)
 *
 * Better Auth(`auth.api.getSession`), env, headers, DAL(`findRoleByUserId`) 모두 mock.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/shared/config/env", () => ({
  env: { NODE_ENV: "test", DATABASE_URL: "postgres://test" },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

vi.mock("./dal/users", () => ({
  findRoleByUserId: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { findRoleByUserId } from "./dal/users";
import { requireAdminRole } from "./admin-role-guard";

const getSessionMock = vi.mocked(auth.api.getSession);
const findRoleMock = vi.mocked(findRoleByUserId);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.E2E_ADMIN_EMAIL;
  delete process.env.E2E_AUTH_USER_ID;
  env.NODE_ENV = "test";
});

describe("requireAdminRole", () => {
  it("session이 없으면 unauthorized 반환", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(result.message).toMatch(/로그인/);
    expect(findRoleMock).not.toHaveBeenCalled();
  });

  it("session 있지만 users row 없음 (DAL null) → forbidden", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-1", email: "x@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findRoleMock.mockResolvedValueOnce(null);

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("forbidden");
  });

  it("session 있고 role='user' → forbidden", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-1", email: "user@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findRoleMock.mockResolvedValueOnce({ role: "user" });

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("forbidden");
    expect(result.message).toMatch(/관리자/);
  });

  it("session 있고 role='admin' → ok", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-admin", email: "admin@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findRoleMock.mockResolvedValueOnce({ role: "admin" });

    const result = await requireAdminRole();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe("u-admin");
    expect(result.role).toBe("admin");
  });

  it("DB 조회 throws → unauthorized (fail-safe, 0030 미적용 환경 보호)", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u-1", email: "x@example.com" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findRoleMock.mockRejectedValueOnce(
      new Error('column "role" does not exist'),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe("requireAdminRole — E2E/데모 bypass", () => {
  it("NODE_ENV=development + E2E_ADMIN_EMAIL + E2E_AUTH_USER_ID → ok (Better Auth+DB 우회)", async () => {
    env.NODE_ENV = "development";
    process.env.E2E_ADMIN_EMAIL = "demo-admin@hesya.local";
    process.env.E2E_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";

    const result = await requireAdminRole();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe("00000000-0000-0000-0000-000000000001");
    expect(result.role).toBe("admin");
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(findRoleMock).not.toHaveBeenCalled();
  });

  it("NODE_ENV=production → bypass 무시 (prod 차단)", async () => {
    env.NODE_ENV = "production";
    process.env.E2E_ADMIN_EMAIL = "demo-admin@hesya.local";
    process.env.E2E_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";
    getSessionMock.mockResolvedValueOnce(null);

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(getSessionMock).toHaveBeenCalled();
  });

  it("E2E_ADMIN_EMAIL set + E2E_AUTH_USER_ID 미set → unauthorized", async () => {
    env.NODE_ENV = "development";
    process.env.E2E_ADMIN_EMAIL = "demo-admin@hesya.local";

    const result = await requireAdminRole();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unauthorized");
    expect(getSessionMock).not.toHaveBeenCalled();
  });
});

describe("admin-role-guard.ts (boundary)", () => {
  it("첫 줄에 server-only import — 클라이언트 번들 유출 방지", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/admin-role-guard.ts", "utf-8");
    expect(src.split("\n")[0]).toBe('import "server-only";');
  });
});
