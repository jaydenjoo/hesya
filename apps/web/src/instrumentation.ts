import * as Sentry from "@sentry/nextjs";

import { ValidationError, WindowClosedError } from "@/shared/lib/errors";

export async function register() {
  await import("@/shared/config/env");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

/**
 * Server Action 공통 에러 캡처 (C-01).
 *
 * Route Handler는 onRequestError가 자동 캡처하지만 Server Action은 누락 →
 * 모든 Server Action은 try-catch 후 이 함수를 호출.
 *
 * 처리 정책:
 * - ValidationError: 사용자 입력 분기 → 완전 skip
 * - WindowClosedError: 24h 윈도우 만료 → warning level (spec § 5.1)
 * - UnauthorizedError, ExternalApiError, WebhookSignatureError, 그 외: error level로 정상 캡처
 */
export function captureServerActionError(
  err: unknown,
  context: { action: string; userId?: string; storeId?: string },
): void {
  if (err instanceof ValidationError) return;

  // PII 최소화 — storeId/userId 풀 UUID 대신 8자 short만 Sentry로
  // (Sec MED-2 storeId, S3 userId). 다른 phase tag(faq_embedding 등)와 일관.
  // 호출자는 무변경.
  const sentryContext = {
    tags: {
      action: context.action,
      ...(context.storeId !== undefined && {
        storeId: context.storeId.slice(0, 8),
      }),
    },
    user: context.userId ? { id: context.userId.slice(0, 8) } : undefined,
  };

  if (err instanceof WindowClosedError) {
    Sentry.captureException(err, { ...sentryContext, level: "warning" });
    return;
  }

  Sentry.captureException(err, sentryContext);
}
