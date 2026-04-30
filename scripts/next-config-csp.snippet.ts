/**
 * Next.js 16.2 CSP 헤더 스니펫
 *
 * next.config.ts의 headers() 안에 복사
 *
 * 참고: https://nextjs.org/docs/app/guides/content-security-policy
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://api.anthropic.com;
  frame-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\n/g, "").trim(),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// 사용:
// next.config.ts
// ──────────────
// import { securityHeaders } from "./scripts/next-config-csp.snippet";
//
// export default {
//   async headers() {
//     return [{ source: "/:path*", headers: securityHeaders }];
//   },
// };
