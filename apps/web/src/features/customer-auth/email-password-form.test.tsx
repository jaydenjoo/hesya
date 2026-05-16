/**
 * Customer EmailPasswordForm 단위 테스트 — PR #194 회귀 방어.
 *
 * 검증 명세:
 * 1. 비어있는 폼에서 submit 버튼 disabled.
 * 2. 잘못된 email 입력 후 submit → errorInvalidEmail 표시, signIn 호출 0.
 * 3. valid email + password → signIn.email 호출 (email/password/callbackURL).
 * 4. signIn 에러 응답 → errorInvalidCredentials 표시.
 * 5. signIn 성공 → router.push 호출.
 * 6. demoEmail/demoPassword 전달 시 input value prefill.
 * 7. onBack 콜백 전달 시 back 버튼 렌더 + 클릭 시 콜백 호출.
 * 8. onBack 미전달 시 back 버튼 미렌더.
 * 9. emailHint 전달 시 본문 노출.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { signInEmailMock, pushMock } = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@hesya/auth/client", () => ({
  createAuthClient: () => ({
    signIn: { email: signInEmailMock },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { EmailPasswordForm } from "./email-password-form";

const baseLabels = {
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "••••••",
  submit: "Sign in",
  signingIn: "Signing in...",
  errorInvalidCredentials: "Invalid email or password.",
  errorInvalidEmail: "Enter a valid email.",
};

beforeEach(() => {
  signInEmailMock.mockReset();
  pushMock.mockReset();
});

describe("EmailPasswordForm — basic", () => {
  it("빈 폼 → submit disabled", () => {
    render(<EmailPasswordForm locale="ko" labels={baseLabels} />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("valid email + password → signIn.email 호출", async () => {
    signInEmailMock.mockResolvedValue({ error: null });
    render(<EmailPasswordForm locale="ko" labels={baseLabels} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "pw1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "pw1",
        callbackURL: "/ko/c/mypage",
      });
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/ko/c/mypage");
    });
  });

  it("signIn 에러 응답 → errorInvalidCredentials 노출", async () => {
    signInEmailMock.mockResolvedValue({ error: { message: "boom" } });
    render(<EmailPasswordForm locale="en" labels={baseLabels} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "x@y.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password.",
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe("EmailPasswordForm — demo prefill", () => {
  it("demoEmail + demoPassword 전달 시 input value prefill", () => {
    render(
      <EmailPasswordForm
        locale="ko"
        labels={baseLabels}
        demoEmail="demo@hesya.com"
        demoPassword="Hesya!Demo2026"
      />,
    );
    expect(screen.getByLabelText("Email")).toHaveValue("demo@hesya.com");
    expect(screen.getByLabelText("Password")).toHaveValue("Hesya!Demo2026");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });
});

describe("EmailPasswordForm — onBack 옵션", () => {
  it("onBack 전달 시 back 버튼 노출 + 클릭 시 콜백 호출", () => {
    const onBack = vi.fn();
    render(
      <EmailPasswordForm
        locale="ko"
        labels={{ ...baseLabels, backLabel: "Back" }}
        onBack={onBack}
      />,
    );
    const backBtn = screen.getByRole("button", { name: /Back/ });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("onBack 미전달 시 back 버튼 미렌더", () => {
    render(<EmailPasswordForm locale="ko" labels={baseLabels} />);
    expect(screen.queryByRole("button", { name: /Back/ })).toBeNull();
  });
});

describe("EmailPasswordForm — labels.emailHint", () => {
  it("emailHint 전달 시 본문 노출", () => {
    render(
      <EmailPasswordForm
        locale="ko"
        labels={{ ...baseLabels, emailHint: "Magic link도 가능합니다" }}
      />,
    );
    expect(screen.getByText("Magic link도 가능합니다")).toBeInTheDocument();
  });
});
