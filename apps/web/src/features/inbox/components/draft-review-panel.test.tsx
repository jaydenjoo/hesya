import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../actions/approve-draft", () => ({
  approveDraft: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../actions/edit-and-send", () => ({
  editAndSend: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../actions/skip-draft", () => ({
  skipDraft: vi.fn(async () => ({ ok: true })),
}));

import { DraftReviewPanel } from "./draft-review-panel";
import { approveDraft } from "../actions/approve-draft";
import { editAndSend } from "../actions/edit-and-send";
import { skipDraft } from "../actions/skip-draft";

const MSG_ID = "11111111-1111-4111-8111-111111111111";

describe("DraftReviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 (텍스트 변경 없음): 승인 enable, 수정 후 전송 disable, 무시 enable", () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕하세요" />);
    const approveBtn = screen.getByRole("button", { name: "승인 + 전송" });
    const editBtn = screen.getByRole("button", { name: "수정 후 전송" });
    const skipBtn = screen.getByRole("button", { name: "무시" });

    expect(approveBtn).not.toBeDisabled();
    expect(editBtn).toBeDisabled();
    expect(skipBtn).not.toBeDisabled();
  });

  it("텍스트 수정 시: 수정 후 전송 enable, 승인 disable", () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕하세요" />);
    const textarea = screen.getByLabelText("AI 초안 편집");
    fireEvent.change(textarea, { target: { value: "수정된 본문" } });

    expect(
      screen.getByRole("button", { name: "수정 후 전송" }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "승인 + 전송" })).toBeDisabled();
  });

  it("빈 텍스트: 승인/수정 후 전송 모두 disable, 무시는 enable", () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    const textarea = screen.getByLabelText("AI 초안 편집");
    fireEvent.change(textarea, { target: { value: "   " } });

    expect(screen.getByRole("button", { name: "승인 + 전송" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "수정 후 전송" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "무시" })).not.toBeDisabled();
  });

  it("승인 클릭 → approveDraft 호출", async () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    fireEvent.click(screen.getByRole("button", { name: "승인 + 전송" }));
    await waitFor(() => {
      expect(approveDraft).toHaveBeenCalledWith({ messageId: MSG_ID });
    });
    expect(editAndSend).not.toHaveBeenCalled();
  });

  it("수정 후 전송 클릭 → editAndSend(newText) 호출 (trim 적용)", async () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    const textarea = screen.getByLabelText("AI 초안 편집");
    fireEvent.change(textarea, { target: { value: "  새 본문  " } });
    fireEvent.click(screen.getByRole("button", { name: "수정 후 전송" }));
    await waitFor(() => {
      expect(editAndSend).toHaveBeenCalledWith({
        messageId: MSG_ID,
        newText: "새 본문",
      });
    });
  });

  it("무시 클릭 → skipDraft 호출", async () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    fireEvent.click(screen.getByRole("button", { name: "무시" }));
    await waitFor(() => {
      expect(skipDraft).toHaveBeenCalledWith({ messageId: MSG_ID });
    });
  });

  it("γ.2.3.2: 패널이 motion-safe slide-in 애니메이션 + amber-500 상단 border (reference 정합)", () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    const panel = screen.getByTestId("draft-review-panel");
    expect(panel.className).toContain("motion-safe:animate-in");
    expect(panel.className).toContain("motion-safe:slide-in-from-bottom-2");
    expect(panel.className).toContain("border-hesya-amber-500");
  });

  it("γ.2.3.2: 승인+전송 / 수정 후 전송은 amber-500 primary, 무시는 ghost (peach-200 border)", () => {
    render(<DraftReviewPanel messageId={MSG_ID} aiText="안녕" />);
    const approveBtn = screen.getByRole("button", { name: "승인 + 전송" });
    const editBtn = screen.getByRole("button", { name: "수정 후 전송" });
    const skipBtn = screen.getByRole("button", { name: "무시" });

    expect(approveBtn.className).toContain("bg-hesya-amber-500");
    expect(approveBtn.className).not.toContain("bg-emerald-500");
    expect(editBtn.className).toContain("bg-hesya-amber-500");
    expect(skipBtn.className).toContain("border-hesya-peach-200");
    expect(skipBtn.className).toContain("bg-transparent");
  });
});
