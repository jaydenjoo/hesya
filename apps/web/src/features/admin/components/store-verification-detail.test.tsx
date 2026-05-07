import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../actions/approve-store-kyc", () => ({
  approveStoreKyc: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../actions/reject-store-kyc", () => ({
  rejectStoreKyc: vi.fn(async () => ({ ok: true })),
}));

import { StoreVerificationDetail } from "./store-verification-detail";
import { approveStoreKyc } from "../actions/approve-store-kyc";

const baseProps = {
  storeId: "store-uuid",
  verificationId: "verif-uuid",
  storeName: "혜야 살롱",
  businessNumber: "1234567890",
  representativeName: "홍길동",
  phone: "01012345678",
  address: { full: "서울시 마포구 와우산로 100" },
  businessLicenseImageUrl: "https://example.com/x.jpg",
  declarationNoMassage: true,
  declarationNoMedicalDevice: true,
  declarationNoOrientalMedicine: true,
};

describe("StoreVerificationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("거절 사유 < 3자 → 거절 버튼 disabled, ≥ 3자 → enabled", () => {
    render(<StoreVerificationDetail {...baseProps} />);
    const rejectBtn = screen.getByRole("button", { name: "거절" });
    expect(rejectBtn).toBeDisabled();

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "ab" } });
    expect(rejectBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "abc" } });
    expect(rejectBtn).not.toBeDisabled();
  });

  it("승인 클릭 → approveStoreKyc(storeId, verificationId) 호출", async () => {
    render(<StoreVerificationDetail {...baseProps} />);
    const approveBtn = screen.getByRole("button", { name: "승인" });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(approveStoreKyc).toHaveBeenCalledTimes(1);
    });
    expect(approveStoreKyc).toHaveBeenCalledWith({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
    });
  });
});
