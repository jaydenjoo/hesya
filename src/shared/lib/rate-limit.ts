/**
 * Rate Limiting 헬퍼
 *
 * 비싼 작업 (AI 호출, 결제, 이메일 발송)에 적용.
 *
 * 사용:
 *   import { checkRateLimit } from '@/shared/lib/rate-limit'
 *
 *   export async function callAI(prompt: string) {
 *     const session = await requireAuth()
 *     await checkRateLimit(`ai:${session.userId}`, { max: 10, windowSec: 60 })
 *     // ...
 *   }
 */

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

// In-memory store (단일 인스턴스용)
// 프로덕션: Upstash Redis 또는 Vercel KV로 교체 권장
const store = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<void> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowSec * 1000 });
    return;
  }

  if (entry.count >= options.max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(retryAfterSec);
  }

  entry.count++;
}

/**
 * 메모리 정리 (1시간마다 만료된 항목 제거)
 * 서버 시작 시 setInterval로 등록
 */
export function startRateLimitGC() {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
      }
    },
    60 * 60 * 1000,
  );
}
