/**
 * fetchInstagramApiClient의 BASE URL이 env.IG_API_BASE_URL로 override 가능한지 검증.
 * E2E 테스트에서 mock server URL로 redirect할 수 있어야 함.
 *
 * 구현 노트: instagram-api-client.ts의 `getBase()`는 매 메서드 호출마다
 * env 객체를 참조한다. envMock을 직접 변이(`envMock.IG_API_BASE_URL = ...`)하면
 * 다음 호출부터 새 값이 반영되어 테스트 간 override 가능.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { envMock } = vi.hoisted(() => ({
  envMock: { IG_API_BASE_URL: "https://graph.instagram.com/v24.0" },
}));

vi.mock("@/shared/config/env", () => ({
  env: envMock,
}));

import { fetchInstagramApiClient } from "./instagram-api-client";

const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  envMock.IG_API_BASE_URL = "https://graph.instagram.com/v24.0";
});

describe("fetchInstagramApiClient — env-based BASE URL", () => {
  it("기본 BASE → graph.instagram.com/v24.0", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "u1", username: "alice" }),
    });
    await fetchInstagramApiClient.getMe("token");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\/graph\.instagram\.com\/v24\.0\/me/);
  });

  it("env.IG_API_BASE_URL override → mock URL 사용", async () => {
    envMock.IG_API_BASE_URL = "http://localhost:4201";
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "u1", username: "alice" }),
    });
    await fetchInstagramApiClient.getMe("token");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toMatch(/^http:\/\/localhost:4201\/me/);
  });
});
