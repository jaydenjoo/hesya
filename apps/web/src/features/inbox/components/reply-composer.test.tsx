import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { sendOutboundMock, learnStoreToneMock } = vi.hoisted(() => ({
  sendOutboundMock: vi.fn(),
  learnStoreToneMock: vi.fn(),
}));

vi.mock("../actions/send-outbound", () => ({
  sendOutbound: sendOutboundMock,
}));

vi.mock("../actions/learn-store-tone", () => ({
  learnStoreTone: learnStoreToneMock,
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

  it("initialValue prop → textarea가 prefill됨 (B-3b)", () => {
    render(
      <ReplyComposer
        conversationId="conv_1"
        disabled={false}
        initialValue="AI 초안 안녕하세요"
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("AI 초안 안녕하세요");
  });

  // ─── Phase 2-B: 매장 톤 학습 버튼 ───

  it("Phase 2-B: 톤 학습 버튼이 툴바에 표시된다 (learnTone)", () => {
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    expect(
      screen.getByRole("button", { name: /learnTone/ }),
    ).toBeInTheDocument();
  });

  it("Phase 2-B: 빈 textarea → 톤 학습 버튼 disabled", () => {
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    expect(screen.getByRole("button", { name: /learnTone/ })).toBeDisabled();
  });

  it("Phase 2-B: 텍스트 입력 후 톤 학습 클릭 → learnStoreTone(text) 호출", async () => {
    learnStoreToneMock.mockResolvedValueOnce({ ok: true, exampleId: "t_1" });
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "안녕하세요 손님~" },
    });
    fireEvent.click(screen.getByRole("button", { name: /learnTone/ }));
    await waitFor(() => {
      expect(learnStoreToneMock).toHaveBeenCalledWith({
        text: "안녕하세요 손님~",
      });
    });
  });

  it("Phase 2-B: 학습 성공 시 success 메시지(learnToneSuccess) 표시", async () => {
    learnStoreToneMock.mockResolvedValueOnce({ ok: true, exampleId: "t_1" });
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "사장님 말투" },
    });
    fireEvent.click(screen.getByRole("button", { name: /learnTone/ }));
    await waitFor(() => {
      expect(screen.getByText("learnToneSuccess")).toBeInTheDocument();
    });
  });

  // 주: HIGH-1 (conversationId 변경 시 stale notice) 검증은 message-view의
  // wrapper + `key={activeId}` 패턴 책임 (PROGRESS L293). ReplyComposer 자체는
  // useEffect-based reset이 React 19 lint 위반이라 caller에 위임.

  it("Phase 2-B LOW-1: textarea 입력 시 learnNotice 사라짐 (다음 학습 흐름 명확화)", async () => {
    learnStoreToneMock.mockResolvedValueOnce({ ok: true, exampleId: "t_y" });
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "첫 입력" },
    });
    fireEvent.click(screen.getByRole("button", { name: /learnTone/ }));
    await waitFor(() => {
      expect(screen.getByText("learnToneSuccess")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "새 입력" },
    });
    expect(screen.queryByText("learnToneSuccess")).not.toBeInTheDocument();
  });

  it("Phase 2-B: 학습 실패 시 error 메시지(learnToneError) 표시", async () => {
    learnStoreToneMock.mockRejectedValueOnce(new Error("학습 실패"));
    render(<ReplyComposer conversationId="conv_1" disabled={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "텍스트" },
    });
    fireEvent.click(screen.getByRole("button", { name: /learnTone/ }));
    await waitFor(() => {
      expect(screen.getByText("learnToneError")).toBeInTheDocument();
    });
    // 에러 메시지 원문이 노출되지 않음
    expect(screen.queryByText(/학습 실패$/)).not.toBeInTheDocument();
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
