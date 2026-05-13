import * as Sentry from "@sentry/nextjs";

// Client bundle: only NEXT_PUBLIC_* env are available at runtime.
// Importing the full env schema here would parse server-only required vars
// (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BETTER_AUTH_SECRET, ...) as
// undefined → ZodError in the browser console. See learnings L-026.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
  // 베타 5곳 단계 — transaction sampling을 줄여 envelope upload 빈도 감소.
  // 10% → 5%. 오류는 100% 수집 유지 (sampling은 정상 transaction만 영향).
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
