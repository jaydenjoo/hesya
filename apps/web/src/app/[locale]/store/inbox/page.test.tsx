import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));
const { requireStoreOwnerAuthMock } = vi.hoisted(() => ({
  requireStoreOwnerAuthMock: vi.fn(),
}));
const { listByStoreMock } = vi.hoisted(() => ({ listByStoreMock: vi.fn() }));
const { getIntegrationMock } = vi.hoisted(() => ({
  getIntegrationMock: vi.fn(),
}));
const { getStoreBotModeMock } = vi.hoisted(() => ({
  getStoreBotModeMock: vi.fn(async () => false),
}));
const { getOwnerShellDataMock } = vi.hoisted(() => ({
  getOwnerShellDataMock: vi.fn(async () => ({
    storeName: "Test Store",
    userName: "Tester",
    userInitial: "T",
  })),
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

vi.mock("@/shared/lib/dal/stores", () => ({
  getStoreBotMode: getStoreBotModeMock,
}));

vi.mock("@/features/shell/get-owner-shell-data", () => ({
  getOwnerShellData: getOwnerShellDataMock,
}));

// OwnerShell pulls in next-intl which doesn't resolve cleanly in vitest.
// Stub to a pass-through component that exposes children.props for assertions.
vi.mock("@/features/shell/owner-shell", () => ({
  OwnerShell: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn().mockReturnValue({}),
}));

// InboxClient는 jsdom에서 리졸브할 필요만 있음 — JSX element의 .props 자체로 검증.
vi.mock("./inbox-client", () => ({
  InboxClient: () => null,
}));

import InboxPage from "./page";
import { UnauthorizedError } from "@/shared/lib/errors";

beforeEach(() => {
  redirectMock.mockReset();
  requireStoreOwnerAuthMock.mockReset();
  listByStoreMock.mockReset();
  getIntegrationMock.mockReset();
  getStoreBotModeMock.mockReset();
  getOwnerShellDataMock.mockReset();
  getStoreBotModeMock.mockResolvedValue(false);
  getOwnerShellDataMock.mockResolvedValue({
    storeName: "Test Store",
    userName: "Tester",
    userInitial: "T",
  });
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
    const ownerShellEl = (await InboxPage({
      params,
    })) as unknown as ReactElement<{
      children: ReactElement<{
        initialConversations: unknown[];
        hasIgIntegration: boolean;
        igTokenExpiresAt: Date | null;
      }>;
    }>;
    const inboxProps = ownerShellEl.props.children.props;
    expect(inboxProps.hasIgIntegration).toBe(false);
    expect(inboxProps.initialConversations).toEqual([]);
    expect(inboxProps.igTokenExpiresAt).toBeNull();
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
    const ownerShellEl = (await InboxPage({
      params,
    })) as unknown as ReactElement<{
      children: ReactElement<{
        initialConversations: unknown[];
        hasIgIntegration: boolean;
        igTokenExpiresAt: Date | null;
      }>;
    }>;
    const inboxProps = ownerShellEl.props.children.props;
    expect(listByStoreMock).toHaveBeenCalledWith({}, "s1");
    expect(getIntegrationMock).toHaveBeenCalledWith({}, "s1", "instagram");
    expect(inboxProps.hasIgIntegration).toBe(true);
    expect(inboxProps.initialConversations).toBe(convs);
    expect(inboxProps.igTokenExpiresAt).toBe(expiresAt);
  });
});
