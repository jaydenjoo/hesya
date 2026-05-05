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
});
