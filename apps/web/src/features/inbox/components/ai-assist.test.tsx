import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AIAssist } from "./ai-assist";

describe("AIAssist (B-3b)", () => {
  it("draft 텍스트 표시", () => {
    render(
      <AIAssist
        draftText="안녕하세요! 내일 3시 가능합니다."
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(
      screen.getByText("안녕하세요! 내일 3시 가능합니다."),
    ).toBeInTheDocument();
  });

  it("'AI가 답변을 준비했어요' eyebrow 표시 (디자인 ref)", () => {
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(screen.getByText(/AI가 답변을 준비/)).toBeInTheDocument();
  });

  it("'그대로 보내기' 클릭 → onAcceptAsIs 호출", async () => {
    const onAcceptAsIs = vi.fn();
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={onAcceptAsIs}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /그대로 보내기/ }),
    );
    expect(onAcceptAsIs).toHaveBeenCalledTimes(1);
  });

  it("'편집 후 보내기' 클릭 → onEditDraft 호출", async () => {
    const onEditDraft = vi.fn();
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={onEditDraft}
        onReject={() => {}}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /편집 후 보내기/ }),
    );
    expect(onEditDraft).toHaveBeenCalledTimes(1);
  });

  it("'거절하고 직접 작성' 클릭 → onReject 호출", async () => {
    const onReject = vi.fn();
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={onReject}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /거절하고 직접 작성/ }),
    );
    expect(onReject).toHaveBeenCalledTimes(1);
  });
});
