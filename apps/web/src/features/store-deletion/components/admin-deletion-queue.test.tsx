import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AdminDeletionQueue } from "./admin-deletion-queue";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/store-deletion/actions", () => ({
  cancelAdminStoreDeletionAction: vi.fn(),
  requestAdminStoreDeletionAction: vi.fn(),
}));

/**
 * γ.2.3.4 — admin 해지 큐 디자인 정합성 검증.
 *
 * 5종 시그널: filter pill 3-state, list peach-100 border + peach-50/40 hover,
 * input/textarea peach-200 + amber-500 focus, 강제해지 form (red semantic 유지),
 * 행 취소 버튼 peach-200 border.
 */
describe("AdminDeletionQueue — γ.2.3.4 디자인 정합성", () => {
  it("active filter — hesya-navy bg + peach-50 text", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    const active = container.querySelector(
      "a.bg-hesya-navy-900.text-hesya-peach-50",
    );
    expect(active).toBeTruthy();
    expect(active?.textContent).toMatch(/진행 중/);
  });

  it("inactive filter — gray-200 border + navy text + hover navy", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    const inactive = container.querySelector(
      "a.border-gray-200.text-hesya-navy-900.hover\\:border-hesya-navy-900",
    );
    expect(inactive).toBeTruthy();
  });

  it("empty state — hesya-navy/60 text", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    expect(container.querySelector("p.text-hesya-navy-900\\/60")).toBeTruthy();
  });

  it("list — peach-100 border + peach-100 divider", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[
          {
            id: "r-1",
            storeId: "s-1",
            storeName: "혜야",
            source: "owner",
            requestedByEmail: "a@b.c",
            reason: null,
            scheduledPurgeAt: new Date("2026-06-10").toISOString(),
            cancelledAt: null,
            cancelledByEmail: null,
            purgedAt: null,
            createdAt: new Date("2026-05-10").toISOString(),
          },
        ]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    expect(
      container.querySelector(
        "ul.border-hesya-peach-100.divide-hesya-peach-100",
      ),
    ).toBeTruthy();
    expect(
      container.querySelector("li.hover\\:bg-hesya-peach-50\\/40"),
    ).toBeTruthy();
  });

  it("input/textarea — peach-200 border + amber-500 focus ring", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    const input = container.querySelector(
      "input.border-hesya-peach-200.focus\\:border-hesya-amber-500",
    );
    const textarea = container.querySelector(
      "textarea.border-hesya-peach-200.focus\\:border-hesya-amber-500",
    );
    expect(input).toBeTruthy();
    expect(textarea).toBeTruthy();
  });

  it("취소 버튼 — peach-200 border + navy text + hover navy", () => {
    const { container } = render(
      <AdminDeletionQueue
        rows={[
          {
            id: "r-1",
            storeId: "s-1",
            storeName: "혜야",
            source: "admin",
            requestedByEmail: "a@b.c",
            reason: null,
            scheduledPurgeAt: new Date("2026-06-10").toISOString(),
            cancelledAt: null,
            cancelledByEmail: null,
            purgedAt: null,
            createdAt: new Date("2026-05-10").toISOString(),
          },
        ]}
        filter="pending"
        locale="ko"
        nowMs={Date.now()}
      />,
    );
    const cancelBtn = container.querySelector(
      "button.border-hesya-peach-200.text-hesya-navy-900.hover\\:border-hesya-navy-900",
    );
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn?.textContent).toMatch(/해지 취소/);
  });
});
