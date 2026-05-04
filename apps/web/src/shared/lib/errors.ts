/** 401 — 인증 누락 */
export class UnauthorizedError extends Error {
  constructor(message = "인증이 필요합니다") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** 403 — 권한 없음 */
export class ForbiddenError extends Error {
  constructor(message = "권한이 없습니다") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** 400 — zod 검증 등 사용자 입력 오류. Sentry 캡처 X. */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** 422 — 24시간 메시징 윈도우 만료. Sentry warning만. */
export class WindowClosedError extends Error {
  constructor(
    public readonly context: { conversationId: string; expiresAt: Date | null },
  ) {
    super(`Messaging window closed for conversation ${context.conversationId}`);
    this.name = "WindowClosedError";
  }
}

/** 502 — 외부 API 호출 실패 (Meta IG, etc.) */
export class ExternalApiError extends Error {
  public readonly context: { status?: number; body?: string };
  constructor(message: string, context: { status?: number; body?: string }) {
    super(message);
    this.name = "ExternalApiError";
    // Sentry 노출 차단 (M-1): body 200자 truncate. Meta 에러 응답에 token 부분 포함 가능.
    const body = context.body;
    this.context = {
      ...context,
      body: body && body.length > 200 ? body.slice(0, 200) + "…" : body,
    };
  }
}

/** 401 — Webhook HMAC 검증 실패. 즉시 Sentry 캡처 (스푸핑 시도). */
export class WebhookSignatureError extends Error {
  constructor() {
    super("Webhook signature verification failed");
    this.name = "WebhookSignatureError";
  }
}
