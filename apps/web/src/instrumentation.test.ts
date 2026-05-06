import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { captureServerActionError } from "./instrumentation";
import { ValidationError, WindowClosedError } from "@/shared/lib/errors";

const FULL_STORE_ID = "11111111-1111-4111-8111-111111111111";
const FULL_USER_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("captureServerActionError (B-4 followup-2 Sec MED-2)", () => {
  it("storeId 풀 UUID → tag로는 8자 short ID만 전송 (PII 최소화)", () => {
    captureServerActionError(new Error("boom"), {
      action: "test.action",
      storeId: FULL_STORE_ID,
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const call = vi.mocked(Sentry.captureException).mock.calls[0];
    const ctx = call?.[1] as { tags: { storeId?: string } } | undefined;
    expect(ctx?.tags.storeId).toBe(FULL_STORE_ID.slice(0, 8));
    expect(ctx?.tags.storeId).not.toBe(FULL_STORE_ID);
  });

  it("storeId 없으면 tag에서 생략", () => {
    captureServerActionError(new Error("boom"), { action: "test.action" });
    const call = vi.mocked(Sentry.captureException).mock.calls[0];
    const ctx = call?.[1] as { tags: Record<string, unknown> } | undefined;
    expect(ctx?.tags).not.toHaveProperty("storeId");
  });

  it("ValidationError → Sentry 호출 안 함 (사용자 입력 분기)", () => {
    captureServerActionError(new ValidationError("bad input"), {
      action: "test.action",
      storeId: FULL_STORE_ID,
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  // ─── S3: userId truncate (PII 최소화 일관) ───

  it("S3: userId 풀 UUID → user.id로 8자 short만 전송 (storeId와 동일 패턴)", () => {
    captureServerActionError(new Error("boom"), {
      action: "test.action",
      userId: FULL_USER_ID,
      storeId: FULL_STORE_ID,
    });
    const call = vi.mocked(Sentry.captureException).mock.calls[0];
    const ctx = call?.[1] as { user?: { id: string } } | undefined;
    expect(ctx?.user?.id).toBe(FULL_USER_ID.slice(0, 8));
    expect(ctx?.user?.id).not.toBe(FULL_USER_ID);
  });

  it("S3: userId 없으면 user 필드 생략 (회귀)", () => {
    captureServerActionError(new Error("boom"), {
      action: "test.action",
      storeId: FULL_STORE_ID,
    });
    const call = vi.mocked(Sentry.captureException).mock.calls[0];
    const ctx = call?.[1] as { user?: unknown } | undefined;
    expect(ctx?.user).toBeUndefined();
  });

  it("WindowClosedError → warning level + storeId truncate", () => {
    captureServerActionError(
      new WindowClosedError({ conversationId: "c1", expiresAt: null }),
      { action: "test.action", storeId: FULL_STORE_ID },
    );
    const call = vi.mocked(Sentry.captureException).mock.calls[0];
    const ctx = call?.[1] as
      | { level?: string; tags: { storeId?: string } }
      | undefined;
    expect(ctx?.level).toBe("warning");
    expect(ctx?.tags.storeId).toBe(FULL_STORE_ID.slice(0, 8));
  });
});
