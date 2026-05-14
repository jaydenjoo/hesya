import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Plan v4 Epic D — 실시간 환율 fetch (Frankfurter ECB 데이터).
 *
 * 외부 손님이 KRW 표시 가격을 모국 통화(JPY/USD/CNY/VND)로 즉시 환산해서 본다.
 * 정적 환율(currency.ts)을 실시간 source로 교체.
 *
 * Source: https://api.frankfurter.dev (ECB Reference Rate, 무료, no API key,
 *         daily update). API key 발급된 BOK Open API로 교체 시 fetcher만 swap.
 *
 * Cache: 1시간 unstable_cache. fetch 실패 시 fallback 정적 환율 사용.
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1/latest";
const FETCH_TIMEOUT_MS = 4000;

const FALLBACK_RATES_PER_KRW: ExchangeRates = {
  JPY: 0.11,
  USD: 0.000714, // 1 USD ≈ 1400 KRW
  CNY: 0.0053, // 1 CNY ≈ 188 KRW
  VND: 18, // 1 KRW ≈ 18 VND
};

export type ExchangeCurrency = "JPY" | "USD" | "CNY" | "VND";

export interface ExchangeRates {
  readonly JPY: number;
  readonly USD: number;
  readonly CNY: number;
  readonly VND: number;
}

async function fetchFromFrankfurter(): Promise<ExchangeRates> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${FRANKFURTER_BASE}?base=KRW&symbols=JPY,USD,CNY,VND`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = (await res.json()) as {
      rates?: Partial<Record<ExchangeCurrency, number>>;
    };
    if (
      !data.rates ||
      typeof data.rates.JPY !== "number" ||
      typeof data.rates.USD !== "number" ||
      typeof data.rates.CNY !== "number" ||
      typeof data.rates.VND !== "number"
    ) {
      throw new Error("Frankfurter response shape unexpected");
    }
    return {
      JPY: data.rates.JPY,
      USD: data.rates.USD,
      CNY: data.rates.CNY,
      VND: data.rates.VND,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1시간 unstable_cache. fetch 실패 시 fallback 정적 환율로 graceful degrade.
 */
export const getCachedExchangeRates = unstable_cache(
  async (): Promise<ExchangeRates> => {
    try {
      return await fetchFromFrankfurter();
    } catch (err) {
      console.warn(
        "[exchange-rate] Frankfurter fetch failed, using fallback:",
        err instanceof Error ? err.message : err,
      );
      return FALLBACK_RATES_PER_KRW;
    }
  },
  ["exchange-rates-frankfurter-v1"],
  { revalidate: 3600, tags: ["exchange-rates"] },
);

export { FALLBACK_RATES_PER_KRW };
