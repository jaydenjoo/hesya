/**
 * Customer SignInForm (magic link) 단위 테스트 — PR #194 회귀 방어.
 *
 * 검증 명세:
 * 1. invalid email submit → errorInvalidEmail 노출, server action 호출 0.
 * 2. valid email submit → customerMagicLinkSignInAction 호출 (email + locale),
 *    ok 응답 시 /{locale}/c/sign-in/sent?email=... 로 push.
 * 3. !ok 응답 시 → result.message 노출 (fallback: errorInvalidEmail).
 * 4. securityNote 본문 노출.
 * 5. 클릭 중 sending 라벨 + disabled.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { actionMock, pushMock } = vi.hoisted(() => ({
  actionMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/app/[locale]/c/sign-in/actions", () => ({
  customerMagicLinkSignInAction: actionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { SignInForm } from "./sign-in-form";

const baseLabels = {
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  submit: "Send magic link",
  sending: "Sending...",
  errorInvalidEmail: "Enter a valid email.",
  securityNote: "We'll never share your email.",
};

beforeEach(() => {
  actionMock.mockReset();
  pushMock.mockReset();
});

describe("SignInForm (magic link)", () => {
  it("invalid email submit → errorInvalidEmail 노출, action 호출 0", async () => {
    render(<SignInForm locale="ko" labels={baseLabels} />);
    const input = screen.getByLabelText("Email");
    // HTML5 type=email은 빈 값 submit을 막지만, 'not-an-email' 같은 invalid 값을
    // 강제 입력 후 form submit 이벤트를 직접 디스패치해 client validation 통과
    // 가정 하에 컴포넌트 측 검증을 본다.
    fireEvent.change(input, { target: { value: "not-an-email" } });
    const form = input.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Enter a valid email.",
      );
    });
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("valid email + ok → action 호출 + sent 페이지로 push", async () => {
    actionMock.mockResolvedValue({ ok: true });
    render(<SignInForm locale="en" labels={baseLabels} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledWith({
        email: "user@example.com",
        locale: "en",
      });
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/en/c/sign-in/sent?email=user%40example.com",
      );
    });
  });

  it("!ok + message → message 노출", async () => {
    actionMock.mockResolvedValue({ ok: false, message: "Rate limited" });
    render(<SignInForm locale="ko" labels={baseLabels} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Rate limited");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("!ok + message 없음 → errorInvalidEmail fallback 노출", async () => {
    actionMock.mockResolvedValue({ ok: false });
    render(<SignInForm locale="ko" labels={baseLabels} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Enter a valid email.",
      );
    });
  });

  it("securityNote 본문 노출", () => {
    render(<SignInForm locale="ko" labels={baseLabels} />);
    expect(
      screen.getByText("We'll never share your email."),
    ).toBeInTheDocument();
  });

  it("action pending 중 sending 라벨 + disabled", async () => {
    let resolve!: (value: { ok: boolean }) => void;
    actionMock.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    render(<SignInForm locale="ko" labels={baseLabels} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });
    resolve({ ok: true });
  });
});
