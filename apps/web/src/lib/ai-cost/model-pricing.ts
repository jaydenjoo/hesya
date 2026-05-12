/**
 * Plan v3 M4.4 — AI 모델 메시지당 추정 비용 (KRW).
 *
 * messages.aiModel 컬럼만으로 정확 cost 추적 불가 (token 단위 미기록).
 * Phase 1 베타에서는 모델별 평균 cost를 상수로 두고 message 수 × avg cost로
 * 추정 dashboard 제공. Phase 2에서 token-level cost 컬럼 추가 후 정확 추적.
 *
 * 단가 출처 (2026-05 기준, USD → KRW @ 1,350):
 *   - Sonnet 4.6: $0.003 input + $0.015 output ≈ avg $0.005/msg ≈ ₩6.75
 *   - Opus 4.7: $0.015 input + $0.075 output ≈ avg $0.025/msg ≈ ₩34
 *   - Haiku 4.5: $0.0008 input + $0.004 output ≈ avg $0.0015/msg ≈ ₩2
 *   - text-embedding-3-small: ~$0.0001/msg ≈ ₩0.135 (반올림 ₩1)
 *
 * 미상 모델은 sonnet 4.6 단가로 추정 (보수적).
 */

export const MODEL_COST_KRW: Record<string, number> = {
  "claude-sonnet-4-6": 7,
  "claude-sonnet-4-6-20251001": 7,
  "claude-opus-4-7": 34,
  "claude-opus-4-7-1m": 34,
  "claude-haiku-4-5": 2,
  "claude-haiku-4-5-20251001": 2,
  "text-embedding-3-small": 1,
};

export const DEFAULT_COST_KRW = 7;

export function estimateCostKrw(model: string | null | undefined): number {
  if (!model) return DEFAULT_COST_KRW;
  return MODEL_COST_KRW[model] ?? DEFAULT_COST_KRW;
}

/**
 * 일일 예산 — admin이 monthly limit / 30으로 추정. Phase 1 default 3M KRW/월.
 */
export const DAILY_BUDGET_KRW = 100_000; // ₩100K/일 = ₩3M/월 추정
