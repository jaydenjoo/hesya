/**
 * Rate Limiting 헬퍼 (Phase 1-γ.0 fix #1, L-082 차단 사항 해소)
 *
 * 비싼 작업 (AI 호출, 결제, 이메일 발송)에 적용.
 *
 * 사용:
 *   import { checkRateLimit } from '@/shared/lib/rate-limit'
 *
 *   export async function callAI(userId: string, prompt: string) {
 *     await checkRateLimit(`ai:${userId}`, { max: 10, windowSec: 60 })
 *     // ...
 *   }
 *
 * 구현:
 * - Upstash Redis sliding window (`@upstash/ratelimit`)
 * - prefix `hesya:rl` — 같은 Redis 인스턴스를 다른 hesya 캐시와 공유 시 키 격리
 * - 인스턴스 캐시: (max, windowSec) 조합당 Ratelimit 1개 lazy 생성
 *
 * 이전 (in-memory Map) 구현은 Vercel Serverless 인스턴스 분산 환경에서 무력화 →
 * Phase 1-γ.0 차단 fix #1로 Upstash Redis 교체.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/shared/config/env";

interface RateLimitOptions {
  max: number; // 최대 요청 수
  windowSec: number; // 시간 창 (초)
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSec: number) {
    super(`너무 많은 요청 — ${retryAfterSec}초 후 재시도`);
    this.name = "RateLimitError";
  }
}

const redis = new Redis({
  url: env.UPSTASH_REDIS_KV_REST_API_URL,
  token: env.UPSTASH_REDIS_KV_REST_API_TOKEN,
});

// (max, windowSec) 조합당 Ratelimit 인스턴스 캐시 — 호출자가 다양한 limit을
// 사용하더라도 인스턴스 재생성 비용 없음.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(options: RateLimitOptions): Ratelimit {
  const cacheKey = `${options.max}:${options.windowSec}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.max, `${options.windowSec} s`),
    prefix: "hesya:rl",
    analytics: false, // 분석 데이터 저장 비용 절감
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<void> {
  const limiter = getLimiter(options);
  const result = await limiter.limit(key);
  if (!result.success) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );
    throw new RateLimitError(retryAfterSec);
  }
}
