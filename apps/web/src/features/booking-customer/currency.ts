/**
 * Plan v3 M2.7 / v4 Epic D — customer-side 가격 다국어 환산.
 *
 * 기본 환율은 시연용 정적 (fallback). 서버 측에서 Frankfurter 실시간 환율을 fetch한
 * 경우 `runtimeRates`로 주입 — 1시간 cache, fetch 실패 시 정적 환율로 graceful
 * degrade.
 *
 * 청구 통화는 항상 KRW (Mock 결제 = KRW 청구).
 */

const STATIC_KRW_PER_JPY = 0.11 as const;
const STATIC_KRW_PER_USD = 0.000714 as const; // 1 USD ≈ 1400 KRW
const STATIC_KRW_PER_CNY = 0.0053 as const; // 1 CNY ≈ 188 KRW

export interface RuntimeRates {
  /** KRW 1단위가 해당 통화로 변환되는 계수. JPY=0.11, USD=0.000714, CNY=0.0053. */
  readonly JPY: number;
  readonly USD: number;
  readonly CNY: number;
  readonly VND: number;
}

function staticConfig(): Record<
  string,
  { code: string; rate: number; symbol: string; precision: number }
> {
  return {
    ko: { code: "KRW", rate: 1, symbol: "₩", precision: 0 },
    en: { code: "USD", rate: STATIC_KRW_PER_USD, symbol: "$", precision: 0 },
    ja: { code: "JPY", rate: STATIC_KRW_PER_JPY, symbol: "¥", precision: 0 },
    // vi는 VND 환율 정확도 부족했지만 runtimeRates 주입 시 정확함. 정적 fallback은 KRW.
    vi: { code: "KRW", rate: 1, symbol: "₩", precision: 0 },
    "zh-CN": {
      code: "CNY",
      rate: STATIC_KRW_PER_CNY,
      symbol: "¥",
      precision: 0,
    },
    "zh-TW": {
      code: "CNY",
      rate: STATIC_KRW_PER_CNY,
      symbol: "¥",
      precision: 0,
    },
  };
}

function localeConfig(
  locale: string,
  rates: RuntimeRates | undefined,
): { code: string; rate: number; symbol: string; precision: number } | null {
  if (rates) {
    const map: Record<
      string,
      { code: string; rate: number; symbol: string; precision: number }
    > = {
      ko: { code: "KRW", rate: 1, symbol: "₩", precision: 0 },
      en: { code: "USD", rate: rates.USD, symbol: "$", precision: 0 },
      ja: { code: "JPY", rate: rates.JPY, symbol: "¥", precision: 0 },
      vi: { code: "VND", rate: rates.VND, symbol: "₫", precision: 0 },
      "zh-CN": { code: "CNY", rate: rates.CNY, symbol: "¥", precision: 0 },
      "zh-TW": { code: "CNY", rate: rates.CNY, symbol: "¥", precision: 0 },
    };
    return map[locale] ?? null;
  }
  return staticConfig()[locale] ?? null;
}

const DEFAULT = staticConfig().ko;

/**
 * KRW → locale 통화로 환산. 표시 형식: `<symbol><amount>`. ko는 ko-KR, 다른 locale은
 * en-US comma format. `runtimeRates` 주입 시 실시간 환율 사용.
 */
export function formatPriceForLocale(
  priceKrw: number,
  locale: string,
  runtimeRates?: RuntimeRates,
): string {
  const cfg = localeConfig(locale, runtimeRates) ?? DEFAULT;
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
export function getCurrencyCodeForLocale(
  locale: string,
  runtimeRates?: RuntimeRates,
): string {
  return (localeConfig(locale, runtimeRates) ?? DEFAULT)?.code ?? "KRW";
}

/**
 * Plan v3 Phase D2-B4 — 결제 페이지에서 사용. user locale 통화가 KRW이면 JPY,
 * 아니면 KRW 라벨을 보조 통화로 반환 (외국인 손님이 모국 통화 + 청구 통화 모두
 * 확인 가능).
 */
export function getSecondaryCurrencyDisplay(
  priceKrw: number,
  locale: string,
  runtimeRates?: RuntimeRates,
): string {
  const cfg = localeConfig(locale, runtimeRates) ?? DEFAULT;
  if (cfg.code === "KRW") {
    return formatPriceForLocale(priceKrw, "ja", runtimeRates);
  }
  return `₩${priceKrw.toLocaleString("ko-KR")}`;
}
