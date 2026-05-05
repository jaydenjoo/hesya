import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/store-knowledge", () => ({
  createStoreKnowledge: vi.fn(),
  updateStoreKnowledge: vi.fn(),
  deleteStoreKnowledge: vi.fn(),
  listStoreKnowledge: vi.fn(),
}));

vi.mock("@/features/inbox/ai/embeddings", () => ({
  generateEmbedding: vi.fn(),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { createFAQ, updateFAQ, deleteFAQ } from "./manage-faq";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  createStoreKnowledge,
  updateStoreKnowledge,
  deleteStoreKnowledge,
  listStoreKnowledge,
} from "@/shared/lib/dal/store-knowledge";
import { generateEmbedding } from "@/features/inbox/ai/embeddings";
import { ValidationError } from "@/shared/lib/errors";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function setSession(storeId = "s1") {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId,
    role: "owner",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createFAQ (B-4c)", () => {
  it("정상 입력 → 임베딩 생성 + DAL insert + ok 반환", async () => {
    setSession("s1");
    vi.mocked(listStoreKnowledge).mockResolvedValue([]);
    vi.mocked(generateEmbedding).mockResolvedValue({
      embedding: Array(1536).fill(0.1),
      tokensUsed: 5,
    });
    vi.mocked(createStoreKnowledge).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s1",
      question: "단발 가능?",
      answer: "네 5만원",
      embedding: Array(1536).fill(0.1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const r = await createFAQ({ question: "단발 가능?", answer: "네 5만원" });

    expect(r).toEqual({ ok: true, id: VALID_UUID });
    expect(generateEmbedding).toHaveBeenCalledWith({
      text: "단발 가능?\n네 5만원",
    });
    expect(createStoreKnowledge).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        storeId: "s1",
        question: "단발 가능?",
        answer: "네 5만원",
        embedding: expect.any(Array),
      }),
    );
  });

  it("입력 형식 오류 → ValidationError (insert 안 함)", async () => {
    setSession();
    await expect(createFAQ({ question: "", answer: "x" })).rejects.toThrow(
      ValidationError,
    );
    expect(createStoreKnowledge).not.toHaveBeenCalled();
  });

  it("매장당 200개 초과 → ValidationError ('FAQ가 가득 찼습니다')", async () => {
    setSession("s1");
    vi.mocked(listStoreKnowledge).mockResolvedValue(
      Array(200).fill({}) as never,
    );
    await expect(createFAQ({ question: "Q", answer: "A" })).rejects.toThrow(
      /가득 찼/,
    );
    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(createStoreKnowledge).not.toHaveBeenCalled();
  });

  it("임베딩 실패 → embedding=null로 insert 진행 (나중에 재생성 가능)", async () => {
    setSession("s1");
    vi.mocked(listStoreKnowledge).mockResolvedValue([]);
    vi.mocked(generateEmbedding).mockRejectedValue(new Error("OpenAI down"));
    vi.mocked(createStoreKnowledge).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s1",
      question: "Q",
      answer: "A",
      embedding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const r = await createFAQ({ question: "Q", answer: "A" });

    expect(r.ok).toBe(true);
    expect(createStoreKnowledge).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ embedding: null }),
    );
  });
});

describe("updateFAQ (B-4c)", () => {
  it("정상 입력 → 임베딩 재생성 + DAL update + ok 반환", async () => {
    setSession("s1");
    vi.mocked(generateEmbedding).mockResolvedValue({
      embedding: Array(1536).fill(0.2),
      tokensUsed: 5,
    });
    vi.mocked(updateStoreKnowledge).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s1",
      question: "Q updated",
      answer: "A updated",
      embedding: Array(1536).fill(0.2),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const r = await updateFAQ({
      id: VALID_UUID,
      question: "Q updated",
      answer: "A updated",
    });

    expect(r).toEqual({ ok: true });
    expect(generateEmbedding).toHaveBeenCalled();
    expect(updateStoreKnowledge).toHaveBeenCalledWith(
      expect.anything(),
      VALID_UUID,
      "s1",
      expect.objectContaining({
        question: "Q updated",
        answer: "A updated",
        embedding: expect.any(Array),
      }),
    );
  });

  it("DAL이 null 반환 (소유 아님 또는 미존재) → ValidationError(통합 메시지)", async () => {
    setSession("s_other");
    vi.mocked(generateEmbedding).mockResolvedValue({
      embedding: Array(1536).fill(0.1),
      tokensUsed: 1,
    });
    vi.mocked(updateStoreKnowledge).mockResolvedValue(null);
    await expect(
      updateFAQ({ id: VALID_UUID, question: "Q", answer: "A" }),
    ).rejects.toThrow(/처리할 수 없습니다/);
  });

  it("입력 형식 오류 → ValidationError", async () => {
    setSession();
    await expect(
      updateFAQ({ id: "not-uuid", question: "Q", answer: "A" }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("deleteFAQ (B-4c)", () => {
  it("정상 → DAL delete + ok 반환", async () => {
    setSession("s1");
    vi.mocked(deleteStoreKnowledge).mockResolvedValue(true);
    const r = await deleteFAQ({ id: VALID_UUID });
    expect(r).toEqual({ ok: true });
    expect(deleteStoreKnowledge).toHaveBeenCalledWith(
      expect.anything(),
      VALID_UUID,
      "s1",
    );
  });

  it("DAL false 반환 (소유 아님 또는 미존재) → ValidationError(통합 메시지)", async () => {
    setSession();
    vi.mocked(deleteStoreKnowledge).mockResolvedValue(false);
    await expect(deleteFAQ({ id: VALID_UUID })).rejects.toThrow(
      /처리할 수 없습니다/,
    );
  });

  it("입력 형식 오류 → ValidationError", async () => {
    setSession();
    await expect(deleteFAQ({ id: "not-uuid" })).rejects.toThrow(
      ValidationError,
    );
  });
});
