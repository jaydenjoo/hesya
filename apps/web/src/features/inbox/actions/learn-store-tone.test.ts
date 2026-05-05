import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/store-tone-examples", () => ({
  insertToneExample: vi.fn(),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

vi.mock("@/shared/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  RateLimitError: class RateLimitError extends Error {
    constructor(public retryAfterSec: number) {
      super(`rate-limited`);
      this.name = "RateLimitError";
    }
  },
}));

import { learnStoreTone } from "./learn-store-tone";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { insertToneExample } from "@/shared/lib/dal/store-tone-examples";
import { ValidationError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";

function setSession(storeId = "s1") {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId,
    role: "owner",
  });
}

describe("learnStoreTone action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("text 빈 문자열 → ValidationError (insertToneExample 미호출)", async () => {
    setSession();
    await expect(learnStoreTone({ text: "" })).rejects.toThrow(ValidationError);
    expect(insertToneExample).not.toHaveBeenCalled();
  });

  it("text 500자 초과 → ValidationError", async () => {
    setSession();
    await expect(learnStoreTone({ text: "가".repeat(501) })).rejects.toThrow(
      ValidationError,
    );
    expect(insertToneExample).not.toHaveBeenCalled();
  });

  it("정상: insertToneExample(db, session.storeId, text) 호출 + ok 반환", async () => {
    setSession("s1");
    vi.mocked(insertToneExample).mockResolvedValue({
      id: "tone_1",
      storeId: "s1",
      content: "안녕하세요 손님~",
      createdAt: new Date(),
    });

    const result = await learnStoreTone({ text: "안녕하세요 손님~" });

    expect(result).toEqual({ ok: true, exampleId: "tone_1" });
    expect(insertToneExample).toHaveBeenCalledWith(
      expect.anything(),
      "s1",
      "안녕하세요 손님~",
    );
  });

  it("Phase 2-B Sec S1: storeId별 rate limit (max 30/hour) 호출", async () => {
    setSession("s_rate");
    vi.mocked(insertToneExample).mockResolvedValue({
      id: "t_rl",
      storeId: "s_rate",
      content: "테스트",
      createdAt: new Date(),
    });

    await learnStoreTone({ text: "테스트" });

    expect(checkRateLimit).toHaveBeenCalledWith(
      "learnTone:s_rate",
      expect.objectContaining({ max: 30, windowSec: 3600 }),
    );
  });

  it("Phase 2-B Sec S1: rate limit 초과 → RateLimitError + insertToneExample 미호출 + Sentry capture 미호출", async () => {
    setSession();
    vi.mocked(checkRateLimit).mockRejectedValueOnce(new RateLimitError(60));

    const { captureServerActionError } = await import("@/instrumentation");

    await expect(learnStoreTone({ text: "x" })).rejects.toThrow(RateLimitError);
    expect(insertToneExample).not.toHaveBeenCalled();
    // RateLimitError는 try 밖에서 발생 → captureServerActionError 미호출 (Sentry 노이즈 0)
    expect(captureServerActionError).not.toHaveBeenCalled();
  });

  it("Phase 2-B MEDIUM-1: insertToneExample이 null 반환 → throw + Sentry capture", async () => {
    setSession("s1");
    vi.mocked(insertToneExample).mockResolvedValue(null);

    const { captureServerActionError } = await import("@/instrumentation");

    await expect(learnStoreTone({ text: "정상 입력" })).rejects.toThrow(
      /insert returned empty/,
    );
    expect(captureServerActionError).toHaveBeenCalled();
  });

  it("DAL throw → captureServerActionError 호출 후 re-throw", async () => {
    setSession("s1");
    vi.mocked(insertToneExample).mockRejectedValueOnce(new Error("db error"));

    const { captureServerActionError } = await import("@/instrumentation");

    await expect(
      learnStoreTone({ text: "사장님 말투 reference" }),
    ).rejects.toThrow(/db error/);
    expect(captureServerActionError).toHaveBeenCalled();
  });
});
