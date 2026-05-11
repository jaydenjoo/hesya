/**
 * Plan v3 M2.7 — customer-side 가격 다국어 환산.
 *
 * 시연용 정적 환율. 실시간 환율 API는 베타 출시 후 정식 도입 (외부 service KYB
 * 필요). 손님이 모국 통화로 대략적인 비용을 즉시 가늠하도록 돕는 게 목적이며,
 * 청구 통화는 항상 KRW (Mock 결제 = KRW 청구).
 *
 * 환율 source: 2026-05 기준 평균값 — 정밀하지 않으나 시연 가치는 충분.
 */

const KRW_PER_JPY = 0.11 as const;
const KRW_PER_USD = 0.000714 as const; // 1 USD ≈ 1400 KRW
const KRW_PER_CNY = 0.0053 as const; // 1 CNY ≈ 188 KRW

const LOCALE_CURRENCY: Record<
  string,
  { code: string; rate: number; symbol: string; precision: number }
> = {
  ko: { code: "KRW", rate: 1, symbol: "₩", precision: 0 },
  en: { code: "USD", rate: KRW_PER_USD, symbol: "$", precision: 0 },
  ja: { code: "JPY", rate: KRW_PER_JPY, symbol: "¥", precision: 0 },
  // VND/TWD 정밀 환율 부담 회피 — 중국어 zh-CN/zh-TW 둘 다 CNY 표시,
  // vi는 KRW fallback (현 시점 환율 정확도 부족).
  vi: { code: "KRW", rate: 1, symbol: "₩", precision: 0 },
  "zh-CN": { code: "CNY", rate: KRW_PER_CNY, symbol: "¥", precision: 0 },
  "zh-TW": { code: "CNY", rate: KRW_PER_CNY, symbol: "¥", precision: 0 },
};

const DEFAULT = LOCALE_CURRENCY.ko;

/**
 * KRW → locale 통화로 환산. ko는 그대로, 다른 locale은 정적 환율 적용.
 * 표시 형식: `<symbol><amount>`. ko는 ko-KR, 다른 locale은 en-US comma format.
 */
export function formatPriceForLocale(priceKrw: number, locale: string): string {
  const cfg = LOCALE_CURRENCY[locale] ?? DEFAULT;
  if (!cfg) {
    return `₩${priceKrw.toLocaleString("ko-KR")}`;
  }
  const converted = Math.round(priceKrw * cfg.rate);
  const numberFormatLocale = cfg.code === "KRW" ? "ko-KR" : "en-US";
  return `${cfg.symbol}${converted.toLocaleString(numberFormatLocale, {
    maximumFractionDigits: cfg.precision,
  })}`;
}

/**
 * "From {price}" 같은 prefix를 외부에서 i18n으로 처리하고 가격만 받고 싶을 때.
 */
export function getCurrencyCodeForLocale(locale: string): string {
  return (LOCALE_CURRENCY[locale] ?? DEFAULT)?.code ?? "KRW";
}
