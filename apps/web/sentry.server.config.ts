import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";
import { sanitizeUrl } from "@/shared/lib/sanitize-url";

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
