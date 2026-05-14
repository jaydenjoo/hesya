/**
 * Plan v5 (Sprint 2) — Mock fixtures 공유 타입.
 *
 * Rich Mock 전략 — 다국어 시나리오, realistic 이름, Unsplash 사진 URL.
 * 베타 매장 매칭 후 `MOCK_FIXTURES=false`로 끄면 자동 실 DB DAL fallback.
 *
 * 각 페이지별 fixture 파일은 `apps/web/src/lib/mock-fixtures/<page>.ts`.
 */

export type Locale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW" | "vi";

export interface LocalizedString {
  readonly ko: string;
  readonly en: string;
  readonly ja: string;
  readonly "zh-CN": string;
  readonly "zh-TW": string;
  readonly vi: string;
}

export interface MockImage {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface MockStore {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly nameLocalized?: LocalizedString;
  readonly district: string;
  readonly heroImage: MockImage;
  readonly rating: number;
  readonly reviewCount: number;
  readonly priceRangeKRW: { readonly min: number; readonly max: number };
  readonly kVerified: boolean;
}

export interface MockCustomer {
  readonly id: string;
  readonly name: string;
  readonly nationality: Locale;
  readonly avatarUrl?: string;
}

/**
 * 모든 mock fixture는 `MOCK_FIXTURES=true`일 때만 의미를 가짐.
 * page 컴포넌트에서 `env.MOCK_FIXTURES ? mockData : realData` 분기.
 */
export const MOCK_NAMESPACE = "hesya-mock-v5" as const;
