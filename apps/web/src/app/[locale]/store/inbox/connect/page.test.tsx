import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () =>
    function t(key: string) {
      return key;
    },
}));

vi.mock("@/features/inbox/actions/connect-instagram", () => ({
  getInstagramOAuthUrl: vi.fn(),
}));

import ConnectPage from "./page";

describe("ConnectPage", () => {
  it("기본 렌더: 제목 + 설명 + 버튼 (notConnected 키)", async () => {
    const sp = Promise.resolve({});
    const ui = await ConnectPage({ searchParams: sp });
    render(ui);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button" })).toBeInTheDocument();
  });

  it("searchParams.error 존재 → 에러 메시지(failed 키) 표시", async () => {
    const sp = Promise.resolve({ error: "exchange_failed" });
    const ui = await ConnectPage({ searchParams: sp });
    render(ui);
    expect(screen.getByRole("alert")).toHaveTextContent("failed");
  });
});
