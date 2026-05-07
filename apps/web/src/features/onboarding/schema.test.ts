import { describe, it, expect } from "vitest";
import { KycApplicationSchema } from "./schema";

const validInput = {
  storeName: "테스트 매장",
  representativeName: "홍길동",
  businessNumber: "1234567890",
  phone: "01012345678",
  address: "서울시 마포구 와우산로 100",
  businessLicenseImageUrl: "https://example.com/license.jpg",
  declarationNoMassage: true,
  declarationNoMedicalDevice: true,
  declarationNoOrientalMedicine: true,
};

describe("KycApplicationSchema", () => {
  it("valid input → success", () => {
    const r = KycApplicationSchema.safeParse(validInput);
    expect(r.success).toBe(true);
  });

  it("invalid business_number (9 digits) → fail", () => {
    const r = KycApplicationSchema.safeParse({
      ...validInput,
      businessNumber: "123456789",
    });
    expect(r.success).toBe(false);
  });

  it("declaration false → fail (자기신고 모두 true 강제)", () => {
    const r = KycApplicationSchema.safeParse({
      ...validInput,
      declarationNoMassage: false,
    });
    expect(r.success).toBe(false);
  });

  it("empty storeName → fail", () => {
    const r = KycApplicationSchema.safeParse({
      ...validInput,
      storeName: "",
    });
    expect(r.success).toBe(false);
  });
});
