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

  it("onAcceptAsIs=undefined → '그대로 보내기' disabled (B-3c 대기)", () => {
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={undefined}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    const accept = screen.getByRole("button", { name: /그대로 보내기/ });
    expect(accept).toBeDisabled();
    expect(accept).toHaveAttribute("title", "다음 단계(B-3c)에서 활성화됩니다");
  });

  it("키보드 Tab → 액션 버튼 순서대로 포커스 이동", async () => {
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: /그대로 보내기/ })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: /편집 후 보내기/ }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: /거절하고 직접 작성/ }),
    ).toHaveFocus();
  });

  it("키보드 Enter → onEditDraft 호출", async () => {
    const onEditDraft = vi.fn();
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={onEditDraft}
        onReject={() => {}}
      />,
    );
    screen.getByRole("button", { name: /편집 후 보내기/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onEditDraft).toHaveBeenCalledTimes(1);
  });

  it("🤖 이모지에 aria-hidden 부여 (스크린리더 무시)", () => {
    const { container } = render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    const emoji = container.querySelector('span[aria-hidden="true"]');
    expect(emoji?.textContent).toContain("🤖");
  });
});
