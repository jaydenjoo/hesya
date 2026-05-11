import { describe, it, expect } from "vitest";

import { formatPriceForLocale, getCurrencyCodeForLocale } from "./currency";

describe("booking-customer/currency", () => {
  describe("formatPriceForLocale", () => {
    it("ko: 그대로 KRW (₩35,000)", () => {
      expect(formatPriceForLocale(35000, "ko")).toBe("₩35,000");
    });

    it("en: USD 환산 ($25 — 35000 * 0.000714 = 24.99 → 25)", () => {
      expect(formatPriceForLocale(35000, "en")).toBe("$25");
    });

    it("ja: JPY 환산 (¥3,850 — 35000 * 0.11 = 3850)", () => {
      expect(formatPriceForLocale(35000, "ja")).toBe("¥3,850");
    });

    it("zh-CN: CNY 환산 (¥186 — 35000 * 0.0053 = 185.5 → 186)", () => {
      expect(formatPriceForLocale(35000, "zh-CN")).toBe("¥186");
    });

    it("zh-TW: CNY로 fallback (¥186)", () => {
      expect(formatPriceForLocale(35000, "zh-TW")).toBe("¥186");
    });

    it("vi: KRW로 fallback (₩35,000)", () => {
      expect(formatPriceForLocale(35000, "vi")).toBe("₩35,000");
    });

    it("미지원 locale: KRW로 fallback", () => {
      expect(formatPriceForLocale(35000, "fr")).toBe("₩35,000");
    });
  });

  describe("getCurrencyCodeForLocale", () => {
    it("ko → KRW", () => {
      expect(getCurrencyCodeForLocale("ko")).toBe("KRW");
    });

    it("en → USD", () => {
      expect(getCurrencyCodeForLocale("en")).toBe("USD");
    });

    it("ja → JPY", () => {
      expect(getCurrencyCodeForLocale("ja")).toBe("JPY");
    });
  });
});
