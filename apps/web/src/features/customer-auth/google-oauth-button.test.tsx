/**
 * Customer GoogleOAuthButton 단위 테스트 — PR #194 회귀 방어.
 *
 * 검증 명세:
 * 1. 기본 상태 — label + aria-label + Google icon 노출, 활성.
 * 2. 클릭 → authClient.signIn.social 호출 (provider=google + callbackURL).
 * 3. 클릭 중 — loadingLabel 노출 + disabled.
 * 4. signIn 예외 시 → loading state 해제 (loadingLabel 사라짐).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { signInSocialMock } = vi.hoisted(() => ({
  signInSocialMock: vi.fn(),
}));

vi.mock("@hesya/auth/client", () => ({
  createAuthClient: () => ({
    signIn: { social: signInSocialMock },
  }),
}));

import { GoogleOAuthButton } from "./google-oauth-button";

beforeEach(() => {
  signInSocialMock.mockReset();
});

describe("GoogleOAuthButton", () => {
  it("기본 상태 — label + aria-label 노출, 활성", () => {
    render(
      <GoogleOAuthButton
        locale="ko"
        label="Continue with Google"
        loadingLabel="Redirecting..."
      />,
    );
    const btn = screen.getByRole("button", { name: "Continue with Google" });
    expect(btn).toBeEnabled();
    expect(btn.getAttribute("aria-label")).toBe("Continue with Google");
  });

  it("클릭 → signIn.social 호출 + locale-aware callbackURL", async () => {
    signInSocialMock.mockResolvedValue(undefined);
    render(
      <GoogleOAuthButton
        locale="en"
        label="Continue with Google"
        loadingLabel="Redirecting..."
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => {
      expect(signInSocialMock).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/en/c/mypage",
      });
    });
  });

  it("클릭 직후 loadingLabel + disabled", async () => {
    let resolve!: () => void;
    signInSocialMock.mockReturnValue(
      new Promise<void>((res) => {
        resolve = res;
      }),
    );
    render(
      <GoogleOAuthButton
        locale="ko"
        label="Continue with Google"
        loadingLabel="Redirecting..."
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    // OAuth는 보통 navigate로 끝남 — 그 사이 loading 상태가 보여야 함.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Continue with Google" }),
      ).toBeDisabled();
    });
    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    resolve();
  });

  it("signIn 예외 시 loading 해제 → 다시 활성", async () => {
    signInSocialMock.mockRejectedValueOnce(new Error("popup blocked"));
    render(
      <GoogleOAuthButton
        locale="ko"
        label="Continue with Google"
        loadingLabel="Redirecting..."
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Continue with Google" }),
      ).toBeEnabled();
    });
    expect(screen.queryByText("Redirecting...")).toBeNull();
  });
});
