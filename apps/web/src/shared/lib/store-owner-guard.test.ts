/**
 * requireStoreOwnerAuth TDD — Better Auth 세션 + store_owners DAL mock.
 *
 * 1. session 없음 → UnauthorizedError
 * 2. session 있지만 store_owners 매칭 없음 → ForbiddenError
 * 3. 정상: { userId, storeId, role } 반환
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const { envMock } = vi.hoisted(() => ({
  envMock: {
    DATABASE_URL: "postgres://test:test@localhost/test",
    NODE_ENV: "test" as "test" | "production" | "development",
  },
}));

vi.mock("@/shared/config/env", () => ({
  env: envMock,
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

vi.mock("./dal/store-owners", () => ({
  findByUserId: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { auth } from "@/lib/auth";
import { findByUserId } from "./dal/store-owners";
import { requireStoreOwnerAuth } from "./store-owner-guard";
import { ForbiddenError, UnauthorizedError } from "./errors";

const getSessionMock = vi.mocked(auth.api.getSession);
const findByUserIdMock = vi.mocked(findByUserId);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.E2E_AUTH_USER_ID;
  envMock.NODE_ENV = "test";
});

describe("requireStoreOwnerAuth", () => {
  it("session이 없으면 UnauthorizedError", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    await expect(requireStoreOwnerAuth()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("session 있지만 store_owners 매칭 없으면 ForbiddenError", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findByUserIdMock.mockResolvedValueOnce(null);
    await expect(requireStoreOwnerAuth()).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("정상: { userId, storeId, role } 반환", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    findByUserIdMock.mockResolvedValueOnce({ storeId: "s1", role: "owner" });

    const got = await requireStoreOwnerAuth();
    expect(got).toEqual({ userId: "u1", storeId: "s1", role: "owner" });
  });

  describe("E2E bypass (E2E_AUTH_USER_ID env)", () => {
    it("test 환경 + E2E_AUTH_USER_ID 설정 → Better Auth 호출 없이 DAL 직접 조회", async () => {
      envMock.NODE_ENV = "test";
      process.env.E2E_AUTH_USER_ID = "e2e_user";
      findByUserIdMock.mockResolvedValueOnce({
        storeId: "s_e2e",
        role: "owner",
      });

      const got = await requireStoreOwnerAuth();

      expect(getSessionMock).not.toHaveBeenCalled();
      expect(findByUserIdMock).toHaveBeenCalledWith({}, "e2e_user");
      expect(got).toEqual({
        userId: "e2e_user",
        storeId: "s_e2e",
        role: "owner",
      });
    });

    it("E2E_AUTH_USER_ID 설정되어도 NODE_ENV='production' → bypass 거부 + 일반 흐름", async () => {
      envMock.NODE_ENV = "production";
      process.env.E2E_AUTH_USER_ID = "e2e_user";
      getSessionMock.mockResolvedValueOnce(null);

      await expect(requireStoreOwnerAuth()).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(getSessionMock).toHaveBeenCalled();
    });

    it("E2E bypass + DAL이 ownership 못 찾으면 ForbiddenError", async () => {
      envMock.NODE_ENV = "test";
      process.env.E2E_AUTH_USER_ID = "e2e_orphan";
      findByUserIdMock.mockResolvedValueOnce(null);

      await expect(requireStoreOwnerAuth()).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });
});
