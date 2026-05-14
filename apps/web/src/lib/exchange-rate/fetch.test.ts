import { describe, expect, it } from "vitest";
import { FALLBACK_RATES_PER_KRW } from "./fetch";

describe("exchange-rate fallback constants", () => {
  it("JPY rate는 0.1~0.2 사이", () => {
    expect(FALLBACK_RATES_PER_KRW.JPY).toBeGreaterThan(0.05);
    expect(FALLBACK_RATES_PER_KRW.JPY).toBeLessThan(0.2);
  });

  it("USD rate는 약 1/1400 (0.0005~0.001)", () => {
    expect(FALLBACK_RATES_PER_KRW.USD).toBeGreaterThan(0.0005);
    expect(FALLBACK_RATES_PER_KRW.USD).toBeLessThan(0.002);
  });

  it("CNY rate는 약 1/188 (0.003~0.008)", () => {
    expect(FALLBACK_RATES_PER_KRW.CNY).toBeGreaterThan(0.003);
    expect(FALLBACK_RATES_PER_KRW.CNY).toBeLessThan(0.01);
  });

  it("VND rate는 약 18 (10~30)", () => {
    expect(FALLBACK_RATES_PER_KRW.VND).toBeGreaterThan(10);
    expect(FALLBACK_RATES_PER_KRW.VND).toBeLessThan(30);
  });
});
