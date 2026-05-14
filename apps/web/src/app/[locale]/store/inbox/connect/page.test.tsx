import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// namespace 별로 다른 prefix를 echo하도록 mock 확장.
// 같은 키("description")가 multi-namespace 페이지에 중복 등장하므로
// getByText("description") 충돌 회피.
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    function t(key: string) {
      return `${namespace}.${key}`;
    },
}));

vi.mock("@/features/inbox/actions/connect-instagram", () => ({
  getInstagramOAuthUrl: vi.fn(),
}));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(async () => ({
    storeId: "store-1",
    userId: "user-1",
  })),
}));

import ConnectPage from "./page";

describe("ConnectPage", () => {
  it("기본 렌더: 제목 + 설명 + 버튼 (notConnected 키)", async () => {
    const params = Promise.resolve({ locale: "ko" });
    const sp = Promise.resolve({});
    const ui = await ConnectPage({ params, searchParams: sp });
    render(ui);
    expect(
      screen.getByText("Inbox.notConnected.description"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Inbox\.notConnected\.button/ }),
    ).toBeInTheDocument();
  });

  it("searchParams.error 화이트리스트 값 → 에러 메시지(failed 키) 표시", async () => {
    const params = Promise.resolve({ locale: "ko" });
    const sp = Promise.resolve({ error: "exchange_failed" });
    const ui = await ConnectPage({ params, searchParams: sp });
    render(ui);
    expect(screen.getByRole("alert")).toHaveTextContent("Inbox.connect.failed");
  });

  it("searchParams.error 알 수 없는 값 → 에러 표시 안 함 (reflected injection 차단)", async () => {
    const params = Promise.resolve({ locale: "ko" });
    const sp = Promise.resolve({ error: "<script>alert(1)</script>" });
    const ui = await ConnectPage({ params, searchParams: sp });
    render(ui);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
