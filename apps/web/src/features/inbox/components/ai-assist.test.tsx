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

  it("onAcceptAsIs=undefined → '그대로 보내기' disabled (B-3c 이전 호환)", () => {
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

  it("isAccepting=true → 모든 액션 disabled + '발송 중...' 라벨 (B-3c)", () => {
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
        isAccepting={true}
      />,
    );
    expect(screen.getByRole("button", { name: /발송 중/ })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /편집 후 보내기/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /거절하고 직접 작성/ }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /^그대로 보내기$/ }),
    ).not.toBeInTheDocument();
  });

  it("isAccepting=false (기본값) → 라벨은 '그대로 보내기'", () => {
    render(
      <AIAssist
        draftText="x"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /^그대로 보내기$/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /발송 중/ }),
    ).not.toBeInTheDocument();
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

describe("AIAssist (Epic 1B-Tone-4: 4탭 활성화)", () => {
  const TONES = {
    warm: "warm-text",
    formal: "formal-text",
    short: "short-text",
    friendly: "friendly-text",
  };

  it("tones 미전달 → 4탭 미표시 (기존 동작 유지)", () => {
    render(
      <AIAssist
        draftText="hi"
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(
      screen.queryByRole("tab", { name: /따뜻하게/ }),
    ).not.toBeInTheDocument();
  });

  it("tones 전달 → 4탭 표시 (따뜻하게/공식적으로/짧게/매장 톤으로)", () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(screen.getByRole("tab", { name: /따뜻하게/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /공식적으로/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /짧게/ })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /매장 톤으로/ }),
    ).toBeInTheDocument();
  });

  it("기본 active tone = warm → draft에 warm 텍스트 표시 + warm 탭 aria-selected", () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(screen.getByText(TONES.warm)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /따뜻하게/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("탭 클릭 → 해당 tone 텍스트 즉시 전환", async () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: /공식적으로/ }));
    expect(screen.getByText(TONES.formal)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /공식적으로/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("그대로 보내기 클릭 → onAcceptAsIs(activeTone) 호출", async () => {
    const onAcceptAsIs = vi.fn();
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        onAcceptAsIs={onAcceptAsIs}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: /짧게/ }));
    await userEvent.click(
      screen.getByRole("button", { name: /그대로 보내기/ }),
    );
    expect(onAcceptAsIs).toHaveBeenCalledWith("short");
  });
});

describe("AIAssist (Epic 1B-Tone Phase 2-A: verification pill + 이유 보기)", () => {
  const TONES = {
    warm: "warm-text",
    formal: "formal-text",
    short: "short-text",
    friendly: "friendly-text",
  };

  const VERIFS = {
    warm: { state: "ok" as const, label: "따뜻한 톤 유지", reason: null },
    formal: {
      state: "warn" as const,
      label: "약간 사무적인 톤",
      reason: "환영 인사가 빠져 있어요.",
    },
    short: {
      state: "warn" as const,
      label: "정보 누락",
      reason: "디자이너 정보가 없어요.",
    },
    friendly: {
      state: "ok" as const,
      label: "친근한 톤 유지",
      reason: null,
    },
  };

  it("verifications 미전달 → pill 미표시 (1B-Tone Phase 1 호환)", () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(screen.queryByText(/따뜻한 톤 유지/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /이유 보기/ }),
    ).not.toBeInTheDocument();
  });

  it("verifications 전달 + 기본 active(warm) → 'ok' pill + 이유 보기 미표시 (reason=null)", () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        verifications={VERIFS}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    expect(screen.getByText("따뜻한 톤 유지")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /이유 보기/ }),
    ).not.toBeInTheDocument();
  });

  it("warn tone 탭 클릭 → warn pill + '이유 보기' 버튼 표시", async () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        verifications={VERIFS}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: /공식적으로/ }));
    expect(screen.getByText("약간 사무적인 톤")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /이유 보기/ }),
    ).toBeInTheDocument();
  });

  it("'이유 보기' 클릭 → reason 텍스트 표시 (popover toggle)", async () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        verifications={VERIFS}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: /공식적으로/ }));
    expect(
      screen.queryByText("환영 인사가 빠져 있어요."),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /이유 보기/ }));
    expect(screen.getByText("환영 인사가 빠져 있어요.")).toBeInTheDocument();
    // 다시 클릭 → 닫힘
    await userEvent.click(screen.getByRole("button", { name: /이유 보기/ }));
    expect(
      screen.queryByText("환영 인사가 빠져 있어요."),
    ).not.toBeInTheDocument();
  });

  it("탭 전환 시 popover 자동 닫힘 (다른 tone reason이 잘못 보이지 않게)", async () => {
    render(
      <AIAssist
        draftText={TONES.warm}
        tones={TONES}
        verifications={VERIFS}
        onAcceptAsIs={() => {}}
        onEditDraft={() => {}}
        onReject={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: /공식적으로/ }));
    await userEvent.click(screen.getByRole("button", { name: /이유 보기/ }));
    expect(screen.getByText("환영 인사가 빠져 있어요.")).toBeInTheDocument();
    // 다른 tone으로 전환
    await userEvent.click(screen.getByRole("tab", { name: /짧게/ }));
    expect(
      screen.queryByText("환영 인사가 빠져 있어요."),
    ).not.toBeInTheDocument();
    // short은 warn이지만 reason은 다른 텍스트, popover는 닫힌 상태
    expect(
      screen.queryByText("디자이너 정보가 없어요."),
    ).not.toBeInTheDocument();
  });
});
