import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/store-integrations", () => ({
  upsertIntegration: vi.fn(async () => undefined),
  markWebhookSubscribed: vi.fn(async () => undefined),
}));

vi.mock("@/lib/inbox/instagram-api-client", () => ({
  fetchInstagramApiClient: {
    subscribeWebhook: vi.fn(async () => undefined),
  },
}));

const { exchangeCodeMock } = vi.hoisted(() => ({
  exchangeCodeMock: vi.fn(async () => ({
    accessToken: "long_tok",
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    externalAccountId: "ig_acc_id",
    externalAccountName: "demo_salon",
    scopes: ["instagram_business_basic", "instagram_business_manage_messages"],
  })),
}));

vi.mock("@/lib/inbox/instagram-adapter", () => ({
  createInstagramAdapter: vi.fn(() => ({
    exchangeCode: exchangeCodeMock,
  })),
}));

import { GET } from "./route";
import { cookies } from "next/headers";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  upsertIntegration,
  markWebhookSubscribed,
} from "@/shared/lib/dal/store-integrations";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

function buildCookieStore(stateValue: string | null) {
  const map = new Map<string, { value: string }>();
  if (stateValue !== null) map.set("ig_oauth_state", { value: stateValue });
  return {
    get: (key: string) => map.get(key),
    delete: (key: string) => map.delete(key),
  };
}

function makeReq(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/oauth/instagram/callback?${qs}`);
}

describe("oauth callback GET", () => {
  beforeEach(() => {
    vi.mocked(cookies).mockReset();
    vi.mocked(requireStoreOwnerAuth).mockReset();
  });

  it("state 누락 → state_mismatch 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore(null) as never);
    const res = await GET(makeReq("code=auth_code"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(
      /\/ko\/store\/inbox\/connect\?error=state_mismatch/,
    );
  });

  it("state 불일치 → state_mismatch 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(
      buildCookieStore("expected_state") as never,
    );
    const res = await GET(makeReq("code=auth_code&state=wrong_state"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(
      /\/ko\/store\/inbox\/connect\?error=state_mismatch/,
    );
  });

  it("code 누락 → state_mismatch 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(
      buildCookieStore("expected_state") as never,
    );
    const res = await GET(makeReq("state=expected_state"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(
      /\/ko\/store\/inbox\/connect\?error=state_mismatch/,
    );
  });

  it("미인증 사용자 → /ko/sign-in 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockRejectedValue(
      new UnauthorizedError("로그인 필요"),
    );

    const res = await GET(makeReq("code=auth_code&state=ok_state"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/ko\/sign-in/);
  });

  it("정상 흐름 → /ko/store/inbox?connected=instagram 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });

    const res = await GET(makeReq("code=auth_code&state=ok_state"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(
      /\/ko\/store\/inbox\?connected=instagram/,
    );
  });

  it("ForbiddenError → /ko/sign-in 리다이렉트", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockRejectedValue(
      new ForbiddenError("권한 없음"),
    );

    const res = await GET(makeReq("code=auth_code&state=ok_state"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/ko\/sign-in/);
  });

  it("requireStoreOwnerAuth가 알 수 없는 에러 throw → 500 (Sentry 캡처)", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockRejectedValue(
      new Error("DB 연결 실패"),
    );

    await expect(GET(makeReq("code=auth_code&state=ok_state"))).rejects.toThrow(
      /DB 연결 실패/,
    );
  });

  it("exchangeCode 실패 → error=exchange_failed 카테고리만 (raw 메시지 노출 X)", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
    exchangeCodeMock.mockRejectedValueOnce(
      new Error("internal: token=secret123 expired"),
    );

    const res = await GET(makeReq("code=auth_code&state=ok_state"));
    expect(res.status).toBe(307);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toMatch(/error=exchange_failed/);
    expect(loc).not.toMatch(/secret123/);
    expect(loc).not.toMatch(/internal/);
  });

  it("정상 흐름 → upsertIntegration + subscribeWebhook + markWebhookSubscribed 호출", async () => {
    vi.mocked(cookies).mockResolvedValue(buildCookieStore("ok_state") as never);
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u2",
      storeId: "store_xyz",
      role: "owner",
    });
    vi.mocked(upsertIntegration).mockClear();
    vi.mocked(markWebhookSubscribed).mockClear();
    vi.mocked(fetchInstagramApiClient.subscribeWebhook).mockClear();

    await GET(makeReq("code=auth_code&state=ok_state"));

    expect(upsertIntegration).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        storeId: "store_xyz",
        channel: "instagram",
        externalAccountId: "ig_acc_id",
        accessToken: "long_tok",
      }),
    );
    expect(fetchInstagramApiClient.subscribeWebhook).toHaveBeenCalledWith({
      pageId: "ig_acc_id",
      accessToken: "long_tok",
    });
    expect(markWebhookSubscribed).toHaveBeenCalledWith(
      expect.anything(),
      "store_xyz",
      "instagram",
    );
  });
});
