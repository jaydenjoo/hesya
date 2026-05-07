import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoreVerificationsList } from "./store-verifications-list";

describe("StoreVerificationsList", () => {
  it("빈 배열 → 안내 텍스트 표시", () => {
    render(<StoreVerificationsList rows={[]} />);
    expect(
      screen.getByText("검토 대기 중인 매장이 없습니다."),
    ).toBeInTheDocument();
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
    const link = screen.getByRole("link", { name: "상세" });
    expect(link).toHaveAttribute(
      "href",
      "/admin/store-verifications/store-uuid-1",
    );
  });
});
