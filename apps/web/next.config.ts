import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    // Sprint 2A: rich mock fixtures의 K-beauty/salon 테마 사진 CDN.
    // 베타 매장 매칭 후 매장 자체 업로드 사진으로 swap (Supabase Storage 등).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !process.env.CI,
  disableLogger: true,
});
