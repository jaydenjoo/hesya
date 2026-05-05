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
});
