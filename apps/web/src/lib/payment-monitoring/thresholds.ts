/**
 * E12-6 결제이상 모니터링 — 임계치 정의 (PRD §1063 "환불 비율·정산 불일치, 매일").
 *
 * Phase 1-γ.1.2 인프라 단계 — Epic 2(결제) 17%(스키마만)라 실제 trigger는 미발생.
 * 베타 5곳까지는 코드 상수로 둠. 사용자 친화 설정 UI는 Epic 2 안정화 후
 * (admin panel에서 매장별 override 같은 것은 베타 데이터 쌓이고 결정).
 *
 * 비유: 온도계의 빨간 줄 위치 — 어디부터 경고 띄울지만 정의. 실제 측정·발송은
 * check-anomalies.ts에서.
 */

/**
 * 환불 비율 임계치. 30% 초과 시 Sentry warning.
 *
 * 근거: PRD가 정량 임계치를 명시하지 않아 베타 보수적 시작. 베타 5곳 운영 후
 * 데이터로 재조정 (1주 환불률 분포 보고 P90~P95 기준 재설정 예정).
 */
export const REFUND_RATE_THRESHOLD = 0.3;

/**
 * 정산 불일치 임계치 (KRW). provider 결제액 합계 vs payments 테이블 합계의
 * 1일 차이가 이 값을 초과하면 Sentry warning.
 *
 * 10,000원 = 매장당 일일 평균 매출의 1% 미만 가정. 베타 운영 후 재조정.
 */
export const SETTLEMENT_MISMATCH_THRESHOLD_KRW = 10_000;

/**
 * 환불 비율 계산 시 최소 표본 수 (분모 보호).
 *
 * 결제 5건 미만이면 표본이 적어 환불 비율이 noise. 임계치 비교 자체를 skip.
 * 매장이 하루에 결제 5건 이상 일어나는 시점부터 모니터링 의미 있음.
 */
export const REFUND_RATE_MIN_SAMPLE_SIZE = 5;
