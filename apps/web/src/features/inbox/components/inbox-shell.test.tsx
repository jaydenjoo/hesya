import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// react-resizable-panels uses ResizeObserver — bypass in jsdom.
vi.mock("@/components/ui/resizable", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    ResizablePanelGroup: Pass,
    ResizablePanel: Pass,
    ResizableHandle: () => null,
  };
});

import { InboxShell } from "./inbox-shell";

describe("InboxShell (Epic 1B-UI A-1: 3-col 골조)", () => {
  it("3-col 슬롯 모두 렌더 (thread / message / context)", () => {
    render(
      <InboxShell
        threadColumn={<div>thread-content</div>}
        messageColumn={<div>message-content</div>}
        contextColumn={<div>context-content</div>}
      />,
    );
    expect(screen.getByText("thread-content")).toBeInTheDocument();
    expect(screen.getByText("message-content")).toBeInTheDocument();
    expect(screen.getByText("context-content")).toBeInTheDocument();
  });

  it("contextColumn 미제공 → placeholder 표시 (A-4 진입 전 빈 상태 안전)", () => {
    render(
      <InboxShell threadColumn={<div>t</div>} messageColumn={<div>m</div>} />,
    );
    // placeholder 식별자 — A-4에서 실제 ContextPanel로 교체 시 자연 제거됨.
    expect(screen.getByTestId("inbox-context-placeholder")).toBeInTheDocument();
  });

  it("aria region/role 적용 (a11y baseline)", () => {
    render(
      <InboxShell
        threadColumn={<div>t</div>}
        messageColumn={<div>m</div>}
        contextColumn={<div>c</div>}
      />,
    );
    expect(
      screen.getByRole("region", { name: /thread list/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /message view/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /customer context/i }),
    ).toBeInTheDocument();
  });
});
