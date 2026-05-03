/**
 * E9-7 KYC Step 5 위험 키워드 차단 helper.
 *
 * PRD § Not Doing 카테고리(마사지·스파·한방·의료기기·성인) 키워드를 매장
 * 입력 텍스트에서 substring 검사. 매칭 시 manual_review 큐로 강등.
 *
 * 매칭 규약:
 *   - case-insensitive (영문 키워드 'spa' 'LED' 대응)
 *   - 단순 substring (한글 word boundary 약함, false positive는 admin 처리)
 *   - 입력 string 또는 string[] 모두 허용 (matchStoreToLocaldata에서 매장명 +
 *     LOCALDATA 후보명 동시 검사)
 *   - 결과 flagged는 중복 제거된 키워드 list
 */
import { KYC_DANGER_KEYWORDS } from "@hesya/shared-types";

export interface KeywordScanResult {
  passed: boolean;
  flagged: string[];
}

type Input = string | Array<string | null | undefined>;

export function scanForDangerKeywords(input: Input): KeywordScanResult {
  const texts = Array.isArray(input) ? input : [input];
  const matched = new Set<string>();

  for (const text of texts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const keyword of KYC_DANGER_KEYWORDS) {
      if (lower.includes(keyword.toLowerCase())) {
        matched.add(keyword);
      }
    }
  }

  const flagged = [...matched];
  return { passed: flagged.length === 0, flagged };
}
