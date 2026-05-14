/**
 * Sprint 2C PR-C2 — Owner Settings 5 placeholder sections mock content.
 *
 * Reference: `docs/design/reference/settings-app.jsx`.
 * 5 sections (Multilingual / Channels / Booking Policy / Payments / Notifications)
 * 시연용 read-only mock — 사업자 등록·결제사 KYB 완료 전 외부 데모에서
 * "완성된 운영 도구" 임팩트 제공.
 *
 * 베타 매장 매칭 후 실 데이터 + 편집 가능 form으로 swap (Phase 1.5).
 */

export interface MockChannel {
  readonly key: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
  readonly name: string;
  readonly status: "connected" | "pending" | "needs_business";
  readonly badge: string;
}

export interface MockPaymentMethod {
  readonly key: "stripe" | "alipay" | "wechat" | "linepay";
  readonly name: string;
  readonly icon: string;
  readonly enabled: boolean;
  readonly feeNote: string;
}

export interface MockNotificationChannel {
  readonly key: "email" | "sms" | "kakao_alimtalk" | "push";
  readonly name: string;
  readonly icon: string;
  readonly enabled: boolean;
  readonly hint: string;
}

export interface MockMultilingualName {
  readonly locale: string;
  readonly flag: string;
  readonly label: string;
  readonly value: string;
  readonly autoTranslated: boolean;
}

/** 매장명 6 언어 — 한국어 원본 + 5 자동 번역 (사장 검수 후 활성화). */
export const mockMultilingualNames: ReadonlyArray<MockMultilingualName> = [
  {
    locale: "ko",
    flag: "🇰🇷",
    label: "한국어 (원본)",
    value: "Hesya 데모 헤어샵 (강남)",
    autoTranslated: false,
  },
  {
    locale: "en",
    flag: "🇺🇸",
    label: "English",
    value: "Hesya Demo Hair Salon (Gangnam)",
    autoTranslated: true,
  },
  {
    locale: "ja",
    flag: "🇯🇵",
    label: "日本語",
    value: "Hesya デモ ヘアサロン (江南)",
    autoTranslated: true,
  },
  {
    locale: "zh-CN",
    flag: "🇨🇳",
    label: "简体中文",
    value: "Hesya 演示美发店 (江南)",
    autoTranslated: true,
  },
  {
    locale: "zh-TW",
    flag: "🇹🇼",
    label: "繁體中文",
    value: "Hesya 示範美髮店 (江南)",
    autoTranslated: true,
  },
  {
    locale: "vi",
    flag: "🇻🇳",
    label: "Tiếng Việt",
    value: "Hesya Salon tóc demo (Gangnam)",
    autoTranslated: true,
  },
];

/** 5 채널 인입 상태 (`/store/inbox/connect`와 일관 — 한 군데서만 편집). */
export const mockChannels: ReadonlyArray<MockChannel> = [
  {
    key: "instagram",
    name: "Instagram Business",
    status: "connected",
    badge: "READY",
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    status: "needs_business",
    badge: "MOCK",
  },
  {
    key: "kakao",
    name: "Kakao Business",
    status: "needs_business",
    badge: "MOCK",
  },
  {
    key: "line",
    name: "LINE Official",
    status: "needs_business",
    badge: "MOCK",
  },
  {
    key: "messenger",
    name: "Facebook Messenger",
    status: "needs_business",
    badge: "MOCK",
  },
];

/** 예약금·취소 정책 — 매장 정책 카드. */
export const mockBookingPolicy = {
  depositPercent: 30,
  cancelHoursThreshold: 24,
  refundFullPercent: 100,
  refundHalfHoursThreshold: 12,
  refundHalfPercent: 50,
  noShowPolicy: "block_2x",
} as const;

/** 4 결제 수단 + Stripe 합산 카드 (mock). */
export const mockPaymentMethods: ReadonlyArray<MockPaymentMethod> = [
  {
    key: "stripe",
    name: "Stripe",
    icon: "💳",
    enabled: true,
    feeNote: "2.9% + ₩300",
  },
  {
    key: "alipay",
    name: "Alipay+ Connect",
    icon: "🇨🇳",
    enabled: true,
    feeNote: "1.5%",
  },
  {
    key: "wechat",
    name: "WeChat Pay",
    icon: "💚",
    enabled: true,
    feeNote: "2.0%",
  },
  {
    key: "linepay",
    name: "LINE Pay",
    icon: "🇯🇵",
    enabled: false,
    feeNote: "1.8%",
  },
];

/** 알림 수단 4종. */
export const mockNotificationChannels: ReadonlyArray<MockNotificationChannel> =
  [
    {
      key: "email",
      name: "Email (Resend)",
      icon: "✉️",
      enabled: true,
      hint: "예약 확정 + 24h 전 리마인더",
    },
    {
      key: "sms",
      name: "SMS (Solapi)",
      icon: "📱",
      enabled: false,
      hint: "사업자 등록 후 활성화",
    },
    {
      key: "kakao_alimtalk",
      name: "Kakao AlimTalk",
      icon: "💬",
      enabled: false,
      hint: "Kakao Business 승인 후 활성화",
    },
    {
      key: "push",
      name: "Web Push",
      icon: "🔔",
      enabled: true,
      hint: "사장 본인 알림 (PWA 설치 후)",
    },
  ];
