/**
 * LOCALDATA `cond[FIELD::LIKE]` 파라미터 안전화.
 *
 * data.go.kr LOCALDATA의 LIKE escape 규약은 미문서화 → ANSI SQL 표준 가정.
 * `\`을 먼저 escape해야 다음 단계가 추가하는 backslash가 다시 escape되지 않는다.
 */
export function escapeLocaldataLike(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}
