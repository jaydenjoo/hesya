/**
 * rate-limit.ts 단위 테스트 (Phase 1-γ.0 fix #1)
 *
 * Upstash 라이브러리(`@upstash/ratelimit`, `@upstash/redis`)를 mock하여
 * 분산 환경 호출 없이 시그니처/캐싱/에러 처리만 검증.
 *
 * 테스트 케이스 분리:
 *   - 케이스마다 (max, windowSec) 옵션을 unique하게 사용 → 모듈 레벨
 *     `limiterCache` 영향 격리.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const limitMock = vi.fn();
const RatelimitConstructor = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}));
    limit = limitMock;
    constructor(config: unknown) {
      RatelimitConstructor(config);
    }
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
  },
}));

vi.mock("@/shared/config/env", () => ({
  env: {
    UPSTASH_REDIS_KV_REST_API_URL: "https://mock-redis.upstash.io",
    UPSTASH_REDIS_KV_REST_API_TOKEN: "mock-token-AAAAAAAAAAAAAAAAAAAAAAAAA",
    NODE_ENV: "test",
  },
}));

// mock 등록 후에 import — env / mocks 적용된 모듈 로드 보장
import { checkRateLimit, RateLimitError } from "./rate-limit";

beforeEach(() => {
  limitMock.mockReset();
});

describe("checkRateLimit", () => {
  it("limit 미만 호출 → 통과 (resolves)", async () => {
    limitMock.mockResolvedValueOnce({
      success: true,
      reset: Date.now() + 60_000,
    });
    await expect(
      checkRateLimit("user:1", { max: 10, windowSec: 60 }),
    ).resolves.toBeUndefined();
    expect(limitMock).toHaveBeenCalledWith("user:1");
  });

  it("limit 초과 → RateLimitError 발생", async () => {
    limitMock.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 30_000,
    });
    await expect(
      checkRateLimit("user:2", { max: 5, windowSec: 30 }),
    ).rejects.toThrow(RateLimitError);
  });

  it("RateLimitError.retryAfterSec — reset 시각 기반, 1 이상", async () => {
    const reset = Date.now() + 45_000;
    limitMock.mockResolvedValueOnce({ success: false, reset });
    try {
      await checkRateLimit("user:3", { max: 3, windowSec: 45 });
      expect.fail("RateLimitError가 던져지지 않음");
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      const error = err as RateLimitError;
      expect(error.retryAfterSec).toBeGreaterThanOrEqual(1);
      expect(error.retryAfterSec).toBeLessThanOrEqual(46);
      expect(error.message).toContain(String(error.retryAfterSec));
    }
  });

  it("같은 (max, windowSec) 옵션 두 번 호출 → Ratelimit 인스턴스 1개만 생성", async () => {
    RatelimitConstructor.mockClear();
    limitMock.mockResolvedValue({
      success: true,
      reset: Date.now() + 70_000,
    });

    await checkRateLimit("user:A", { max: 7, windowSec: 70 });
    await checkRateLimit("user:B", { max: 7, windowSec: 70 });

    expect(RatelimitConstructor).toHaveBeenCalledTimes(1);
  });

  it("다른 (max, windowSec) 옵션 → 별도 Ratelimit 인스턴스 생성", async () => {
    RatelimitConstructor.mockClear();
    limitMock.mockResolvedValue({
      success: true,
      reset: Date.now() + 80_000,
    });

    await checkRateLimit("user:X", { max: 8, windowSec: 80 });
    await checkRateLimit("user:Y", { max: 9, windowSec: 90 });

    expect(RatelimitConstructor).toHaveBeenCalledTimes(2);
  });

  it("Ratelimit 생성 시 prefix='hesya:rl' + analytics=false", async () => {
    RatelimitConstructor.mockClear();
    limitMock.mockResolvedValue({
      success: true,
      reset: Date.now() + 110_000,
    });

    await checkRateLimit("user:Z", { max: 11, windowSec: 110 });

    expect(RatelimitConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "hesya:rl",
        analytics: false,
      }),
    );
  });
});

describe("RateLimitError", () => {
  it("name이 'RateLimitError'이고 retryAfterSec 보존", () => {
    const err = new RateLimitError(30);
    expect(err.name).toBe("RateLimitError");
    expect(err.retryAfterSec).toBe(30);
    expect(err.message).toContain("30");
  });
});
