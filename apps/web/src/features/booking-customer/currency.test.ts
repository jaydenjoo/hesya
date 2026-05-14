import { describe, it, expect } from "vitest";

import {
  formatPriceForLocale,
  getCurrencyCodeForLocale,
  type RuntimeRates,
} from "./currency";

const liveRates: RuntimeRates = {
  JPY: 0.108,
  USD: 0.00072,
  CNY: 0.00518,
  VND: 18.3,
};

describe("booking-customer/currency", () => {
  describe("runtime rates (Plan v4 Epic D)", () => {
    it("ja: runtimeRates 주입 시 실시간 환율 사용 (¥5,400 — 50000 * 0.108)", () => {
      expect(formatPriceForLocale(50000, "ja", liveRates)).toBe("¥5,400");
    });

    it("vi: runtimeRates 주입 시 ₫ VND 표시 (₫915,000 — 50000 * 18.3)", () => {
      expect(formatPriceForLocale(50000, "vi", liveRates)).toBe("₫915,000");
    });

    it("vi: runtimeRates → currency code = VND", () => {
      expect(getCurrencyCodeForLocale("vi", liveRates)).toBe("VND");
    });

    it("ko: 항상 ₩ KRW (rate=1, runtime 무관)", () => {
      expect(formatPriceForLocale(50000, "ko", liveRates)).toBe("₩50,000");
    });
  });

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
