import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PendingStatus } from "./pending-status";

describe("PendingStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows '검토 중' for manual_review", () => {
    render(<PendingStatus initialStatus="manual_review" />);
    expect(screen.getByText(/검토 중/)).toBeInTheDocument();
  });

  it("shows '승인됨' for auto_approved (with IG link)", () => {
    render(<PendingStatus initialStatus="auto_approved" />);
    expect(screen.getByText(/승인됨/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Instagram 연결" });
    expect(link).toHaveAttribute("href", "/store/inbox/connect");
  });

  it("shows '거절됨' for rejected", () => {
    render(<PendingStatus initialStatus="rejected" />);
    expect(screen.getByText(/거절됨/)).toBeInTheDocument();
  });

  it("transitions manual_review → auto_approved via polling", async () => {
    // Real timers + 짧은 pollMs(20)로 폴링 1~2회 발생 후 fetch 결과 → setState 반영.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, status: "auto_approved", storeId: "s1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PendingStatus initialStatus="manual_review" pollMs={20} />);
    expect(screen.getByText(/검토 중/)).toBeInTheDocument();

    await waitFor(
      () => expect(screen.getByText(/승인됨/)).toBeInTheDocument(),
      { timeout: 1000 },
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/store/me/status");
  });

  it("401 → session_expired 표시 + 폴링 중단", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, error: "unauthorized" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PendingStatus initialStatus="manual_review" pollMs={20} />);

    await waitFor(
      () => expect(screen.getByText(/세션 만료/)).toBeInTheDocument(),
      { timeout: 1000 },
    );
    const signInLink = screen.getByRole("link", { name: "다시 로그인하세요" });
    expect(signInLink).toHaveAttribute("href", "/sign-in");
  });

  it("γ.2.3.3: manual_review → warn tone 카드 (amber-500 border + peach-100 bg)", () => {
    render(<PendingStatus initialStatus="manual_review" />);
    const card = screen.getByTestId("pending-status-card");
    expect(card.dataset.tone).toBe("warn");
    expect(card.className).toContain("border-hesya-amber-500");
    expect(card.className).toContain("bg-hesya-peach-100");
  });

  it("γ.2.3.3: auto_approved → success tone 카드 + amber primary CTA", () => {
    render(<PendingStatus initialStatus="auto_approved" />);
    const card = screen.getByTestId("pending-status-card");
    expect(card.dataset.tone).toBe("success");
    expect(card.className).toContain("border-emerald-500");
    const cta = screen.getByRole("link", { name: "Instagram 연결" });
    expect(cta.className).toContain("bg-hesya-amber-500");
  });

  it("M6 audit fix: rejected → error tone 카드 (hesya-danger-600 + 100, admin disputes crit token 통일)", () => {
    render(<PendingStatus initialStatus="rejected" />);
    const card = screen.getByTestId("pending-status-card");
    expect(card.dataset.tone).toBe("error");
    expect(card.className).toContain("border-hesya-danger-600");
    expect(card.className).toContain("bg-hesya-danger-100");
  });

  it("γ.2.3.3: pending → neutral tone 카드", () => {
    render(<PendingStatus initialStatus="pending" />);
    const card = screen.getByTestId("pending-status-card");
    expect(card.dataset.tone).toBe("neutral");
    expect(card.className).toContain("border-hesya-peach-200");
  });
});
