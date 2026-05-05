import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/conversations", () => ({
  listByStore: vi.fn(),
}));

vi.mock("@/shared/lib/dal/messages", () => ({
  listByConversation: vi.fn(),
}));

import { GET } from "./route";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { listByStore } from "@/shared/lib/dal/conversations";
import { listByConversation } from "@/shared/lib/dal/messages";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

function makeReq(qs = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/inbox/refresh${qs ? `?${qs}` : ""}`,
  );
}

describe("inbox refresh GET", () => {
  beforeEach(() => {
    vi.mocked(requireStoreOwnerAuth).mockReset();
    vi.mocked(listByStore).mockReset();
    vi.mocked(listByConversation).mockReset();
  });

  it("미인증 → 401", async () => {
    vi.mocked(requireStoreOwnerAuth).mockRejectedValue(
      new UnauthorizedError("로그인 필요"),
    );
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("권한 없음 → 403", async () => {
    vi.mocked(requireStoreOwnerAuth).mockRejectedValue(
      new ForbiddenError("권한 없음"),
    );
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it("정상 (activeId 없음) → conversations만 반환", async () => {
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "store_1",
      role: "owner",
    });
    vi.mocked(listByStore).mockResolvedValue([
      { id: "conv_1" } as never,
      { id: "conv_2" } as never,
    ]);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.conversations).toHaveLength(2);
    expect(json.messages).toEqual({});
    expect(listByConversation).not.toHaveBeenCalled();
  });

  it("activeId 지정 → 해당 conversation messages 포함", async () => {
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: "store_1",
      role: "owner",
    });
    vi.mocked(listByStore).mockResolvedValue([{ id: "conv_1" } as never]);
    vi.mocked(listByConversation).mockResolvedValue([
      { id: "msg_1" } as never,
      { id: "msg_2" } as never,
    ]);

    const res = await GET(makeReq("activeId=conv_1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.messages.conv_1).toHaveLength(2);
  });
});
