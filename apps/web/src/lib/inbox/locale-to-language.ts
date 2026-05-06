/**
 * Epic Customer 확장 (CC-4) — IG locale → Hesya 5개 지원 언어 매핑.
 *
 * IG profile API의 `locale` 필드는 보통 `xx_YY` 형식 (e.g., `en_US`, `ko_KR`).
 * Hesya는 5개 언어만 지원 (ko/en/zh/ja/vi). 미지원 locale은 null 반환 →
 * caller가 기존 fallback 흐름 ('ko' 등)을 적용한다.
 *
 * **간/번체 통합**: zh_CN(简体)과 zh_TW(繁體)는 `'zh'`로 통일. AI 응답
 * 번역 시 LLM이 문맥에 맞춰 처리. 미세 구분은 별 follow-up 가능.
 */

const SUPPORTED = new Set(["en", "ko", "zh", "ja", "vi"] as const);
type SupportedLanguage = "en" | "ko" | "zh" | "ja" | "vi";

export function mapLocaleToLanguage(
  locale: string | null,
): SupportedLanguage | null {
  if (!locale) return null;
  const trimmed = locale.trim();
  if (trimmed.length === 0) return null;
  // "en_US" / "en-US" / "EN_us" 모두 prefix만 보고 매칭 (case-insensitive).
  const prefix = trimmed.split(/[-_]/)[0]?.toLowerCase();
  if (!prefix) return null;
  return SUPPORTED.has(prefix as SupportedLanguage)
    ? (prefix as SupportedLanguage)
    : null;
}
