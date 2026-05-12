import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoreVerificationsList } from "./store-verifications-list";

describe("StoreVerificationsList", () => {
  it("빈 배열 → 안내 텍스트 표시 (peach-50 carded)", () => {
    const { container } = render(<StoreVerificationsList rows={[]} />);
    expect(
      screen.getByText("검토 대기 중인 매장이 없습니다."),
    ).toBeInTheDocument();
    expect(container.querySelector("div.bg-hesya-peach-50")).toBeTruthy();
  });

  it("rows 1건 → 매장명 + 상세 링크 href 정확", () => {
    render(
      <StoreVerificationsList
        rows={[
          {
            id: "store-uuid-1",
            name: "혜야 살롱",
            createdAt: new Date("2026-05-07T00:00:00Z"),
          },
        ]}
      />,
    );
    expect(screen.getByText("혜야 살롱")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /상세/ });
    expect(link).toHaveAttribute(
      "href",
      "/admin/store-verifications/store-uuid-1",
    );
  });

  it("M6.9b — 상세 링크 amber-600 (blue 미사용)", () => {
    const { container } = render(
      <StoreVerificationsList
        rows={[
          {
            id: "store-uuid-1",
            name: "혜야 살롱",
            createdAt: new Date("2026-05-07T00:00:00Z"),
          },
        ]}
      />,
    );
    expect(container.querySelector("a.text-hesya-amber-600")).toBeTruthy();
    expect(container.querySelector("a.text-blue-600")).toBeNull();
  });

  it("M6.9b — table row peach-100 border + peach-50 hover", () => {
    const { container } = render(
      <StoreVerificationsList
        rows={[
          {
            id: "s-1",
            name: "혜야",
            createdAt: new Date("2026-05-07T00:00:00Z"),
          },
        ]}
      />,
    );
    expect(
      container.querySelector(
        "tbody tr.border-hesya-peach-100.hover\\:bg-hesya-peach-50",
      ),
    ).toBeTruthy();
  });
});
