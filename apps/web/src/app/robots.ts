import type { MetadataRoute } from "next";

// Phase zeta.5 — search engine indexing block for admin / owner / mypage routes.
// See docs/security/abnormal-access-audit-2026-05-19.md K-1.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/*/admin",
          "/*/admin/",
          "/*/admin/*",
          "/store",
          "/store/",
          "/store/*",
          "/*/store",
          "/*/store/",
          "/*/store/*",
          "/c/mypage",
          "/c/mypage/*",
          "/*/c/mypage",
          "/*/c/mypage/*",
          "/sign-in",
          "/*/sign-in",
          "/c/sign-in",
          "/*/c/sign-in",
          "/onboarding",
          "/*/onboarding",
          "/*/onboarding/*",
          "/api/",
        ],
      },
    ],
  };
}
