import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));
const { requireStoreOwnerAuthMock } = vi.hoisted(() => ({
  requireStoreOwnerAuthMock: vi.fn(),
}));
const { listByStoreMock } = vi.hoisted(() => ({ listByStoreMock: vi.fn() }));
const { getIntegrationMock } = vi.hoisted(() => ({
  getIntegrationMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: requireStoreOwnerAuthMock,
}));

vi.mock("@/shared/lib/dal/conversations", () => ({
  listByStore: listByStoreMock,
}));

vi.mock("@/shared/lib/dal/store-integrations", () => ({
  getIntegration: getIntegrationMock,
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn().mockReturnValue({}),
}));

vi.mock("./inbox-client", () => ({
  InboxClient: (props: unknown) => {
    return { __test_props: props };
  },
}));

import InboxPage from "./page";
import { UnauthorizedError } from "@/shared/lib/errors";

beforeEach(() => {
  redirectMock.mockReset();
  requireStoreOwnerAuthMock.mockReset();
  listByStoreMock.mockReset();
  getIntegrationMock.mockReset();
});

describe("InboxPage", () => {
  it("미인증 → /[locale]/sign-in 리다이렉트", async () => {
    requireStoreOwnerAuthMock.mockRejectedValueOnce(
      new UnauthorizedError("no session"),
    );
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const params = Promise.resolve({ locale: "ko" });
    await expect(InboxPage({ params })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/ko/sign-in");
  });

  it("인증 + IG 미연결 → InboxClient에 hasIgIntegration=false 전달", async () => {
    requireStoreOwnerAuthMock.mockResolvedValueOnce({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
    listByStoreMock.mockResolvedValueOnce([]);
    getIntegrationMock.mockResolvedValueOnce(null);

    const params = Promise.resolve({ locale: "ko" });
    const result = (await InboxPage({ params })) as unknown as {
      props: {
        initialConversations: unknown[];
        hasIgIntegration: boolean;
        igTokenExpiresAt: Date | null;
      };
    };
    expect(result.props.hasIgIntegration).toBe(false);
    expect(result.props.initialConversations).toEqual([]);
    expect(result.props.igTokenExpiresAt).toBeNull();
  });

  it("인증 + IG 연결 → DAL 호출 + igTokenExpiresAt 전달", async () => {
    requireStoreOwnerAuthMock.mockResolvedValueOnce({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
    const convs = [{ id: "c1" }];
    const expiresAt = new Date("2026-12-01T00:00:00Z");
    listByStoreMock.mockResolvedValueOnce(convs);
    getIntegrationMock.mockResolvedValueOnce({
      tokenExpiresAt: expiresAt,
    });

    const params = Promise.resolve({ locale: "ko" });
    const result = (await InboxPage({ params })) as unknown as {
      props: {
        initialConversations: unknown[];
        hasIgIntegration: boolean;
        igTokenExpiresAt: Date | null;
      };
    };
    expect(listByStoreMock).toHaveBeenCalledWith({}, "s1");
    expect(getIntegrationMock).toHaveBeenCalledWith({}, "s1", "instagram");
    expect(result.props.hasIgIntegration).toBe(true);
    expect(result.props.initialConversations).toBe(convs);
    expect(result.props.igTokenExpiresAt).toBe(expiresAt);
  });
});
