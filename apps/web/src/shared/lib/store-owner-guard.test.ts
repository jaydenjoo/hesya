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

vi.mock("@/shared/config/env", () => ({
  env: { DATABASE_URL: "postgres://test:test@localhost/test" },
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
});
