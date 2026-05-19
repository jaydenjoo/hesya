import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("analytics.track — server PostHog capture", () => {
  const originalEnv = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchSpy);
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    process.env.POSTHOG_ENABLE_DEV = "1";
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("dev에서 POSTHOG_ENABLE_DEV=1 면 capture endpoint 호출", async () => {
    const { track } = await import("./analytics");
    await track("kyc_submitted", "abc12345", { storeId: "def67890" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://us.i.posthog.com/capture/");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.event).toBe("kyc_submitted");
    expect(body.distinct_id).toBe("abc12345");
    expect(body.properties.storeId).toBe("def67890");
    expect(body.properties.$source).toBe("server");
    expect(body.api_key).toBe("phc_test");
  });

  it("POSTHOG_ENABLE_DEV 미설정 + dev면 no-op", async () => {
    delete process.env.POSTHOG_ENABLE_DEV;
    const { track } = await import("./analytics");
    await track("test", "u");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("apiKey 누락이면 silent skip", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { track } = await import("./analytics");
    await track("test", "u");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetch reject 시 throw 안 함 (fail-silent)", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network"));
    const { track } = await import("./analytics");
    await expect(track("test", "u")).resolves.toBeUndefined();
  });

  it("host 끝 슬래시 trailing 정리 후 /capture/ 합성", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com/";
    const { track } = await import("./analytics");
    await track("test", "u");
    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://us.i.posthog.com/capture/");
  });
});

describe("analytics.shortId", () => {
  it("8자 prefix", async () => {
    const { shortId } = await import("./analytics");
    expect(shortId("abcdef01-2345-6789-abcd-ef0123456789")).toBe("abcdef01");
  });
});
