const SENSITIVE_PARAMS = [
  "access_token",
  "client_secret",
  "code",
  "refresh_token",
] as const;

/**
 * URL query string에서 sensitive params를 [REDACTED]로 마스킹.
 *
 * Sentry breadcrumb / event URL에서 OAuth code, IG access_token,
 * client_secret 등이 access log / Sentry dashboard로 누출되는 것을 차단.
 *
 * Meta IG long-lived token endpoint는 client_secret을 GET URL query에 포함
 * 강제 (POST body 미지원). sanitize는 보안 핵심.
 *
 * malformed URL은 변경 없이 원본 반환.
 */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const p of SENSITIVE_PARAMS) {
      if (u.searchParams.has(p)) {
        u.searchParams.set(p, "[REDACTED]");
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}
