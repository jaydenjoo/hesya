import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KycForm } from "./kyc-form";

describe("KycForm", () => {
  it("renders all fields + 3 declarations", () => {
    render(<KycForm onSubmit={() => {}} />);
    expect(screen.getByText("매장명")).toBeInTheDocument();
    expect(screen.getByText("사업자번호 (숫자 10자리)")).toBeInTheDocument();
    expect(screen.getByText("대표자명")).toBeInTheDocument();
    expect(screen.getByText("전화 (숫자만)")).toBeInTheDocument();
    expect(screen.getByText("주소")).toBeInTheDocument();
    expect(screen.getByText("영업신고증 이미지 URL")).toBeInTheDocument();
    expect(
      screen.getByText("마사지업·안마시술소 영업하지 않습니다"),
    ).toBeInTheDocument();
    expect(screen.getByText("의료기기 사용하지 않습니다")).toBeInTheDocument();
    expect(screen.getByText("한방 시술하지 않습니다")).toBeInTheDocument();
  });

  it("submit button disabled until 3 declarations checked", () => {
    render(<KycForm onSubmit={() => {}} />);
    const button = screen.getByRole("button", { name: "제출" });
    expect(button).toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);

    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    expect(button).toBeDisabled();

    fireEvent.click(checkboxes[2]!);
    expect(button).not.toBeDisabled();
  });

  it("γ.2.3.3: submit 버튼이 amber-500 primary (검은 버튼 → Hesya 토큰)", () => {
    render(<KycForm onSubmit={() => {}} />);
    const button = screen.getByTestId("kyc-form-submit");
    expect(button.className).toContain("bg-hesya-amber-500");
    expect(button.className).not.toContain("bg-black");
  });

  it("γ.2.3.3: input field가 peach-200 border + amber-500 focus ring (Hesya 토큰)", () => {
    const { container } = render(<KycForm onSubmit={() => {}} />);
    const input = container.querySelector('input[type="text"]');
    expect(input?.className).toContain("border-hesya-peach-200");
    expect(input?.className).toContain("focus:border-hesya-amber-500");
  });

  it("γ.2.3.3: 자기신고 fieldset이 peach-50 bg + peach-200 border (Hesya 토큰)", () => {
    const { container } = render(<KycForm onSubmit={() => {}} />);
    const fieldset = container.querySelector("fieldset");
    expect(fieldset?.className).toContain("bg-hesya-peach-50");
    expect(fieldset?.className).toContain("border-hesya-peach-200");
  });

  it("submit calls onSubmit with current field values", () => {
    const onSubmit = vi.fn();
    const { container } = render(<KycForm onSubmit={onSubmit} />);
    // 필수 필드 채우기 (HTML required로 차단되는 걸 회피).
    const textInputs = container.querySelectorAll(
      'input[type="text"], input[type="url"]',
    );
    textInputs.forEach((el, i) => {
      const input = el as HTMLInputElement;
      // 사업자번호(2번 인덱스, pattern \d{10})와 URL은 적합한 값 주입.
      if (input.type === "url") {
        fireEvent.change(input, {
          target: { value: "https://example.com/x.jpg" },
        });
      } else if (input.getAttribute("pattern") === "\\d{10}") {
        fireEvent.change(input, { target: { value: "1234567890" } });
      } else {
        fireEvent.change(input, { target: { value: `value-${i}` } });
      }
    });
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => fireEvent.click(cb));
    // form의 onSubmit으로 직접 호출 — fireEvent.submit이 더 안정적.
    fireEvent.submit(container.querySelector("form")!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]![0];
    expect(arg.declarationNoMassage).toBe(true);
    expect(arg.declarationNoMedicalDevice).toBe(true);
    expect(arg.declarationNoOrientalMedicine).toBe(true);
  });
});
