/**
 * E9-7 KYC Step 5 위험 키워드 차단 list (50개+ 6 카테고리).
 *
 * Source of truth: PRD § "카테고리 Not Doing — 가입 절대 금지" (line 92~96)
 *   1. 마사지·발마사지·스포츠마사지·아로마·경락·산모·림프 (의료법, 3년/3천만)
 *   2. 안마시술소·스파·테라피·스웨디시·타이마사지·중국식 (의료법 88조 1호, 5년/5천만)
 *   3. 한방 시술·한의원 (의료해외진출법)
 *   4. 의료기기 매장 (LED·고주파·울쎄라·인모드·레이저·IPL — Phase 2)
 *   5. 시각장애인 안마시술소 (별도 시장)
 *
 * 추가: 성인·유흥 (PRD 미명시이나 시장 통념상 차단 권장)
 *
 * 매칭 규약: 단순 substring match. 한글 word boundary 약함 + 형태소 분석
 * deps 무거움 → false positive는 manual_review 큐에서 admin 처리 (4원칙 2번).
 *
 * 후속 admin UI(Epic 12) 도입 시 DB 테이블로 이전 가능 (현재는 declarative const).
 */

export const KYC_DANGER_KEYWORDS_BY_CATEGORY = {
  /** PRD 1: 마사지 (의료법 무자격 안마행위) */
  massage: [
    "마사지",
    "발마사지",
    "스포츠마사지",
    "아로마",
    "경락",
    "산모",
    "림프",
    "massage",
  ] as const,

  /** PRD 2: 안마·스파 (의료법 88조 1호) */
  spa: [
    "안마시술소",
    "안마",
    "스파",
    "spa",
    "테라피",
    "therapy",
    "스웨디시",
    "타이마사지",
  ] as const,

  /** PRD 3: 한방·한의원 (의료해외진출법) */
  oriental: ["한의원", "한방", "침", "뜸", "부항", "한약"] as const,

  /** PRD 4: 의료기기·시술 */
  medicalDevice: [
    "LED",
    "고주파",
    "울쎄라",
    "인모드",
    "레이저",
    "laser",
    "IPL",
    "보톡스",
    "botox",
    "필러",
    "filler",
    "리프팅",
    "박피",
    "메조",
    "시술",
  ] as const,

  /** PRD 일반: 의약·의료 */
  medical: ["의약", "의료", "클리닉", "clinic", "병원"] as const,

  /** 추가: 성인·유흥 (PRD 미명시, 시장 통념) */
  adult: [
    "성인",
    "유흥",
    "룸살롱",
    "노래방",
    "단란",
    "bar",
    "클럽",
    "술집",
  ] as const,
} as const;

export type KycDangerKeywordCategory =
  keyof typeof KYC_DANGER_KEYWORDS_BY_CATEGORY;

/** 모든 카테고리의 키워드를 flat 배열로. 매칭 helper에서 순회용. */
export const KYC_DANGER_KEYWORDS: readonly string[] = Object.values(
  KYC_DANGER_KEYWORDS_BY_CATEGORY,
).flat();
