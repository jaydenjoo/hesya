import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";
import { sanitizeUrl } from "@/shared/lib/sanitize-url";

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
  // 베타 5곳 단계 — 10% → 5%. 오류 수집 100% 유지.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  beforeBreadcrumb(breadcrumb) {
    if (typeof breadcrumb.data?.url === "string") {
      breadcrumb.data.url = sanitizeUrl(breadcrumb.data.url);
    }
    return breadcrumb;
  },
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = sanitizeUrl(event.request.url);
    }
    return event;
  },
});
