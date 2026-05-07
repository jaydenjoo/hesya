/**
 * Phase 1-β L-080 — RSC Date serialization helper.
 *
 * 문제: Server Component → Client Component prop으로 Date 객체 전달 시 Next.js가
 * ISO string으로 자동 직렬화. Client에서 `.getTime()` / `.toISOString()` /
 * `Intl.DateTimeFormat.format()` 직접 호출하면 TypeError 또는 RangeError 발생.
 *
 * 해결: Client component는 `Date | string | null` 받고, 사용 시 본 helper로 변환.
 *
 * 발견 경위 (가상 시뮬 2026-05-07): Playwright phase-1-beta.spec.ts 실행 중
 * thread-item / window-utils / message-bubble / context-panel / store-verifications-list
 * 등 client component 6+ 곳에서 동일 패턴 fail. 베타 매장 owner inbox 페이지
 * 진입 시 즉시 깨지는 production-critical 버그.
 *
 * 향후 backlog: server side (page.tsx)에서 명시적 ISO string 변환으로 통일하면
 * client는 항상 string만 받게 되어 가장 깔끔. 본 helper는 그 전 과도기 안전망.
 */

export type MaybeDate = Date | string | null | undefined;

/**
 * MaybeDate → Date | null. Invalid string도 null로 정규화.
 *
 * - `null` / `undefined` / 빈 문자열 → `null`
 * - 유효한 Date 객체 → 그대로
 * - ISO string → Date 변환
 * - 무효한 입력 (NaN Date) → `null`
 */
export function toDate(d: MaybeDate): Date | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `Intl.DateTimeFormat.format(d)` invalid Date 안전 wrapper.
 *
 * 예: `safeFormat(d, DATE_FMT)` 형태로 client component에서 사용.
 */
export function safeFormat(
  d: MaybeDate,
  formatter: Intl.DateTimeFormat,
  fallback = "-",
): string {
  const date = toDate(d);
  return date ? formatter.format(date) : fallback;
}
