import { describe, it, expect, beforeEach, vi } from "vitest";

const cookieStoreMock = {
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

import { getInstagramOAuthUrl } from "./connect-instagram";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

describe("getInstagramOAuthUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
  });

  it("Instagram authorize URL 반환", async () => {
    const url = await getInstagramOAuthUrl();
    expect(url).toMatch(/^https:\/\/www\.instagram\.com\/oauth\/authorize/);
    expect(url).toMatch(/client_id=stub-ig-app-id/);
    expect(url).toMatch(/scope=instagram_business_basic/);
    expect(url).toMatch(/response_type=code/);
    expect(url).toMatch(/state=[0-9a-f]{64}/);
  });

  it("ig_oauth_state cookie 설정 (httpOnly + secure + sameSite=lax + 5분)", async () => {
    await getInstagramOAuthUrl();
    expect(cookieStoreMock.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = cookieStoreMock.set.mock.calls[0]!;
    expect(name).toBe("ig_oauth_state");
    expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 5 * 60,
      path: "/",
    });
  });

  it("매장 사장 인증 호출", async () => {
    await getInstagramOAuthUrl();
    expect(requireStoreOwnerAuth).toHaveBeenCalledTimes(1);
  });
});
