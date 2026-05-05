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

describe("fetchInstagramApiClient.fetchUserProfile (CC-3)", () => {
  it("정상 응답: name/profilePic/locale 반환", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "Alice Kim",
        profile_pic: "https://cdn.example.com/a.jpg",
        locale: "en_US",
      }),
    });
    const result = await fetchInstagramApiClient.fetchUserProfile({
      igUserId: "12345",
      accessToken: "tok",
    });
    expect(result).toEqual({
      name: "Alice Kim",
      profilePic: "https://cdn.example.com/a.jpg",
      locale: "en_US",
    });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toMatch(
      /\/12345\?.*fields=name,profile_pic,locale.*access_token=tok/,
    );
  });

  it("일부 필드 누락 (privacy 정책) → 누락은 null로 graceful", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "Bob" }), // profile_pic + locale 누락
    });
    const result = await fetchInstagramApiClient.fetchUserProfile({
      igUserId: "67890",
      accessToken: "tok",
    });
    expect(result).toEqual({
      name: "Bob",
      profilePic: null,
      locale: null,
    });
  });

  it("404 또는 ok=false → ExternalApiError throw", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '{"error":"not found"}',
    });
    await expect(
      fetchInstagramApiClient.fetchUserProfile({
        igUserId: "404id",
        accessToken: "tok",
      }),
    ).rejects.toThrow(/IG.*프로필.*조회 실패|fetchUserProfile/i);
  });
});
