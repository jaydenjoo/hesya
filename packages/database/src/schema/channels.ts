/**
 * 인박스 채널 enum 단일 소스 (review M-1).
 *
 * SQL CHECK constraint(`conversations.channel`, `messages.channel`,
 * `customers.channel`, `store_integrations.channel`)와 TypeScript 코드의
 * Channel union이 분기되지 않도록 한 곳에서 정의.
 *
 * 채널 추가 시:
 * 1. CHANNELS 배열에 추가
 * 2. SQL migration 작성 — `conversations_channel_check`,
 *    `store_integrations_channel_check` 등 CHECK constraint 갱신
 */
export const CHANNELS = [
  "instagram",
  "whatsapp",
  "kakao",
  "line",
  "messenger",
] as const;

export type Channel = (typeof CHANNELS)[number];
