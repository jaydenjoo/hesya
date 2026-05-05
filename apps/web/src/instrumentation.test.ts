import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { captureServerActionError } from "./instrumentation";
import { ValidationError, WindowClosedError } from "@/shared/lib/errors";

const FULL_STORE_ID = "11111111-1111-4111-8111-111111111111";

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
