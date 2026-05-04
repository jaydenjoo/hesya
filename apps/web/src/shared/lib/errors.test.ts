import { describe, it, expect } from "vitest";
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  WindowClosedError,
  ExternalApiError,
  WebhookSignatureError,
} from "./errors";

describe("error classes", () => {
  it("UnauthorizedError에 기본 메시지가 있다", () => {
    const e = new UnauthorizedError();
    expect(e.name).toBe("UnauthorizedError");
    expect(e.message).toBe("인증이 필요합니다");
  });

  it("WindowClosedError에 윈도우 만료 시각을 담는다", () => {
    const expiresAt = new Date("2026-05-04T00:00:00Z");
    const e = new WindowClosedError({ conversationId: "abc", expiresAt });
    expect(e.context.conversationId).toBe("abc");
    expect(e.context.expiresAt).toBe(expiresAt);
  });

  it("ExternalApiError가 status code를 보존한다", () => {
    const e = new ExternalApiError("Meta API 5xx", {
      status: 502,
      body: "...",
    });
    expect(e.context.status).toBe(502);
  });

  it("WebhookSignatureError는 항상 동일 메시지", () => {
    const e = new WebhookSignatureError();
    expect(e.message).toBe("Webhook signature verification failed");
  });

  it("ForbiddenError에 기본 메시지가 있다", () => {
    const e = new ForbiddenError();
    expect(e.name).toBe("ForbiddenError");
    expect(e.message).toBe("권한이 없습니다");
  });

  it("ValidationError가 issues를 보존한다", () => {
    const issues = [{ path: ["email"], message: "invalid" }];
    const e = new ValidationError("검증 실패", issues);
    expect(e.name).toBe("ValidationError");
    expect(e.message).toBe("검증 실패");
    expect(e.issues).toBe(issues);
  });
});
