/**
 * 사업장명 정규화 — NTS 사업자명과 LOCALDATA 사업장명을 비교 가능 형태로 변환.
 *
 * 정규화 단계:
 *   1. 빈 입력(null/undefined/"") → ""
 *   2. 공백 제거 (모든 whitespace)
 *   3. 법인 접미사 제거 ((주), ㈜, 주식회사)
 *   4. 영문 소문자 통일
 *
 * @example
 *   normalizeBusinessName("(주) HAIR 청담") // → "hair청담"
 */
export function normalizeBusinessName(
  input: string | null | undefined,
): string {
  if (!input) return "";
  const stripped = input.replace(/\(주\)|㈜|주식회사/g, "");
  const noSpace = stripped.replace(/\s+/g, "");
  return noSpace.toLowerCase();
}
