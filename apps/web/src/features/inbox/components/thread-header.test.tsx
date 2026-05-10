import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadHeader } from "./thread-header";

describe("ThreadHeader", () => {
  it("renders customer display name", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });

  it("renders channel label badge", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    expect(screen.getByText("channelInstagram")).toBeInTheDocument();
  });

  it("알 수 없는 channel → fallback 키(channelUnknown) 사용", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="some-future-channel"
        windowExpiresAt={null}
      />,
    );
    expect(screen.getByText("channelUnknown")).toBeInTheDocument();
    expect(screen.queryByText("some-future-channel")).not.toBeInTheDocument();
  });

  it("A-3a: avatar(이름 첫 글자) 표시", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    expect(screen.getByTestId("thread-header-avatar")).toHaveTextContent("홍");
  });

  it("A-3a: customerName 비어있어도 avatar fallback ('?')", () => {
    render(
      <ThreadHeader
        customerName=""
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    expect(screen.getByTestId("thread-header-avatar")).toHaveTextContent("?");
  });

  it("A-3a: 채널 아이콘 표시 (avatar 우하단)", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    expect(
      screen.getByTestId("thread-header-channel-icon"),
    ).toBeInTheDocument();
  });

  it("γ.2.3.2: 헤더 64px 높이 + peach-100 하단 border + 36px avatar (reference 정합)", () => {
    const { container } = render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    const header = container.querySelector("header");
    expect(header?.className).toContain("h-16");
    expect(header?.className).toContain("border-hesya-peach-100");

    const avatar = screen.getByTestId("thread-header-avatar");
    expect(avatar.className).toContain("h-9");
    expect(avatar.className).toContain("w-9");
  });

  it("γ.2.3.2: 채널 라벨이 meta row 스타일 (11px gray-500)로 렌더 — Badge 제거", () => {
    render(
      <ThreadHeader
        customerName="홍길동"
        channel="instagram"
        windowExpiresAt={null}
      />,
    );
    const meta = screen.getByTestId("thread-header-meta");
    expect(meta).toHaveTextContent("channelInstagram");
    expect(meta.className).toContain("text-[11px]");
    expect(meta.className).toContain("text-gray-500");
  });
});
