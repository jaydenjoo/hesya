/**
 * Levenshtein 편집 거리와 유사도 계산.
 *
 * - distance: 한 문자열을 다른 문자열로 바꾸는 최소 편집 횟수
 *   (삽입/삭제/치환 각 1).
 * - similarity: 1 - distance / max(len), 0~1 범위. 둘 다 빈 문자열이면 1.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const aChars = Array.from(a);
  const bChars = Array.from(b);
  const m = aChars.length;
  const n = bChars.length;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = aChars[i - 1] === bChars[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // 삽입
        prev[j] + 1, // 삭제
        prev[j - 1] + cost, // 치환
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(Array.from(a).length, Array.from(b).length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}
