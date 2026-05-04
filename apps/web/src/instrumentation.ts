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
 * 사용자 입력 정상 분기(ValidationError, WindowClosedError)는 캡처 X.
 */
export function captureServerActionError(
  err: unknown,
  context: { action: string; userId?: string; storeId?: string },
): void {
  if (err instanceof ValidationError || err instanceof WindowClosedError)
    return;
  Sentry.captureException(err, {
    tags: { action: context.action, storeId: context.storeId ?? "unknown" },
    user: context.userId ? { id: context.userId } : undefined,
  });
}
