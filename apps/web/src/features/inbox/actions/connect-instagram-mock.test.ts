/**
 * Plan v3 M1.3 — `MOCK_IG_OAUTH=true` 분기 단위 테스트.
 *
 * env 전체 mock으로 MOCK_IG_OAUTH=true 강제 → getInstagramOAuthUrl이 본인
 * callback URL을 반환하는지 검증. 기존 `connect-instagram.test.ts`는 default
 * (MOCK_IG_OAUTH=false)로 Instagram URL 반환 확인.
 */
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

vi.mock("@/shared/config/env", () => ({
  env: {
    MOCK_IG_OAUTH: true,
    NEXT_PUBLIC_APP_URL: "http://localhost:4200",
    NODE_ENV: "test",
    IG_APP_ID: "stub-ig-app-id",
    IG_REDIRECT_URI: "https://stub.example.com/api/oauth/instagram/callback",
  },
}));

import { getInstagramOAuthUrl } from "./connect-instagram";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

describe("getInstagramOAuthUrl — MOCK_IG_OAUTH=true 분기", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
  });

  it("Instagram URL이 아니라 본인 callback URL 반환", async () => {
    const url = await getInstagramOAuthUrl();
    expect(url).toMatch(
      /^http:\/\/localhost:4200\/api\/oauth\/instagram\/callback/,
    );
    expect(url).not.toMatch(/instagram\.com/);
  });

  it("callback URL에 code=mock_code_... + state 포함", async () => {
    const url = await getInstagramOAuthUrl();
    expect(url).toMatch(/code=mock_code_[0-9a-f]{16}/);
    expect(url).toMatch(/state=[0-9a-f]{64}/);
  });

  it("state cookie도 정상 설정됨 (callback route가 검증)", async () => {
    await getInstagramOAuthUrl();
    expect(cookieStoreMock.set).toHaveBeenCalledTimes(1);
    const [name] = cookieStoreMock.set.mock.calls[0]!;
    expect(name).toBe("ig_oauth_state");
  });

  it("매장 사장 인증은 Mock 모드에서도 동일하게 호출", async () => {
    await getInstagramOAuthUrl();
    expect(requireStoreOwnerAuth).toHaveBeenCalledTimes(1);
  });
});
