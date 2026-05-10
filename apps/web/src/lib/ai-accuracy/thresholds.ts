/**
 * E12-7 AI 응답 정확도 모니터링 — 임계치 정의 (PRD §1063 "정확도 < 90% 즉시 알림").
 *
 * Phase 1-γ.1.3 인프라 단계 — Phase 1-β draft review 모드 데이터(messages.draftStatus
 * + editedFromAi + reviewedBy)를 source로 사용. cron 등록은 후속.
 *
 * 비유: 학생 시험 채점 — "10번 이상 시험 본 학생만 평균 매기고, 평균 90점 미만이면
 * 보강 알림". 시험 적게 본 학생은 평가 보류.
 */

/**
 * 정확도 임계치. 90% 미만이면 Sentry warning.
 *
 * 근거: PRD §1063 "AI 응답 정확도 90%+", §1185 "Phase 1 Day 90 success criteria".
 */
export const ACCURACY_THRESHOLD = 0.9;

/**
 * 정확도 평가 최소 표본 수.
 *
 * 표본이 적으면 정확도가 noise. 1건 수정/skip만으로 100% → 0% 폭주.
 * 베타 운영 데이터 누적 후 재조정 (P50 일일 결과 30~50건 이상 가정).
 */
export const MIN_SAMPLE_SIZE = 10;
