import { describe, expect, it } from "vitest";
import { sanitizeUrl } from "./sanitize-url";

/**
 * Sentry breadcrumb / event URL sanitize.
 * H-1 (보안 리뷰): Meta IG long-lived token endpoint가 client_secret을 GET URL
 * query string에 포함 → Vercel/Cloudflare access log + Sentry breadcrumb에 노출.
 *
 * sanitizeUrl이 sensitive params를 [REDACTED]로 마스킹.
 */
describe("sanitizeUrl", () => {
  it("access_token 마스킹", () => {
    const url =
      "https://graph.instagram.com/v24.0/me?fields=id&access_token=ABC123";
    expect(sanitizeUrl(url)).toBe(
      "https://graph.instagram.com/v24.0/me?fields=id&access_token=%5BREDACTED%5D",
    );
  });

  it("client_secret 마스킹 (Meta long-lived token endpoint)", () => {
    const url =
      "https://graph.instagram.com/v24.0/access_token?grant_type=ig_exchange_token&client_secret=SECRET&access_token=TOKEN";
    const sanitized = sanitizeUrl(url);
    expect(sanitized).toContain("client_secret=%5BREDACTED%5D");
    expect(sanitized).toContain("access_token=%5BREDACTED%5D");
    expect(sanitized).not.toContain("SECRET");
    expect(sanitized).not.toContain("TOKEN");
  });

  it("OAuth code 마스킹", () => {
    const url = "https://example.com/cb?code=AUTH_CODE&state=xyz";
    const sanitized = sanitizeUrl(url);
    expect(sanitized).toContain("code=%5BREDACTED%5D");
    expect(sanitized).toContain("state=xyz");
    expect(sanitized).not.toContain("AUTH_CODE");
  });

  it("refresh_token 마스킹", () => {
    const url = "https://example.com/?refresh_token=RT123&foo=bar";
    expect(sanitizeUrl(url)).toContain("refresh_token=%5BREDACTED%5D");
  });

  it("sensitive param 없으면 변경 없음", () => {
    const url = "https://example.com/path?foo=bar&baz=qux";
    expect(sanitizeUrl(url)).toBe(url);
  });

  it("malformed URL은 원본 반환", () => {
    expect(sanitizeUrl("not a url")).toBe("not a url");
    expect(sanitizeUrl("")).toBe("");
  });
});
