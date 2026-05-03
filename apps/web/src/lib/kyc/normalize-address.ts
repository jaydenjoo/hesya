/**
 * 도로명 주소 정규화 — NTS와 LOCALDATA의 표기 차이 흡수.
 *
 * 정규화 단계:
 *   1. 빈 입력(null/undefined/"") → ""
 *   2. 연속 공백 → 단일 공백, 양끝 trim
 *   3. 시·도 약칭 통일 (서울특별시 → 서울, 부산광역시 → 부산, OO도 → OO)
 *   4. "번지" 제거
 */
export function normalizeAddress(input: string | null | undefined): string {
  if (!input) return "";
  const collapsed = input.replace(/\s+/g, " ").trim();
  const noBunji = collapsed.replace(/번지/g, "");
  return noBunji
    .replace(/^서울특별시/, "서울")
    .replace(/^부산광역시/, "부산")
    .replace(/^대구광역시/, "대구")
    .replace(/^인천광역시/, "인천")
    .replace(/^광주광역시/, "광주")
    .replace(/^대전광역시/, "대전")
    .replace(/^울산광역시/, "울산")
    .replace(/^세종특별자치시/, "세종")
    .replace(/^제주특별자치도/, "제주")
    .replace(/^강원특별자치도/, "강원")
    .replace(/^강원도/, "강원")
    .replace(/^전북특별자치도/, "전북")
    .replace(/^전라북도/, "전북")
    .replace(/^전라남도/, "전남")
    .replace(/^경기도/, "경기")
    .replace(/^충청북도/, "충북")
    .replace(/^충청남도/, "충남")
    .replace(/^전라남도/, "전남")
    .replace(/^경상북도/, "경북")
    .replace(/^경상남도/, "경남");
}
