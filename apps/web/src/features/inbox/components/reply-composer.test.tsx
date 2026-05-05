import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { sendOutboundMock } = vi.hoisted(() => ({
  sendOutboundMock: vi.fn(),
}));

vi.mock("../actions/send-outbound", () => ({
  sendOutbound: sendOutboundMock,
}));

import { ReplyComposer } from "./reply-composer";

describe("ReplyComposer", () => {
  it("disabled=true → textarea/button 비활성화", () => {
    render(<ReplyComposer conversationId="conv_1" disabled={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "send" })).toBeDisabled();
  });

  it("입력 후 send 클릭 → sendOutbound 호출", async () => {
    sendOutboundMock.mockResolvedValueOnce({ ok: true, messageId: "ext_1" });
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);

    const textbox = screen.getByRole("textbox");
    fireEvent.change(textbox, { target: { value: "안녕하세요" } });
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(sendOutboundMock).toHaveBeenCalledWith({
        conversationId: "conv_1",
        text: "안녕하세요",
      });
    });
  });

  it("빈 텍스트는 send 비활성화", () => {
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    expect(screen.getByRole("button", { name: "send" })).toBeDisabled();
  });

  it("Textarea aria-label 존재 (label 키)", () => {
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-label", "label");
  });

  it("sendOutbound 실패 → err.message 노출 없이 일반화 메시지(sendErrorGeneric) 표시", async () => {
    sendOutboundMock.mockRejectedValueOnce(
      new Error("대화를 찾을 수 없습니다"),
    );
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "send" }));
    await waitFor(() => {
      expect(screen.getByText("sendErrorGeneric")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/대화를 찾을 수 없습니다/),
    ).not.toBeInTheDocument();
  });
});
