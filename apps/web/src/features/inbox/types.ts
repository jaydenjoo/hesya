import type { conversations, customers, messages } from "@hesya/database";

/** DB row 형식. apps/web 내부에서 inbox 도메인 타입을 단일 import 경로로. */
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Customer = typeof customers.$inferSelect;

/**
 * Inbox thread list에서 사용. conversation row + `customers.name` 동봉으로
 * UI가 customer UUID 대신 이름 표시. DAL의 `listByStore` 반환 타입과 1:1.
 *
 * `lastMessagePreviewKr`: thread row 2번째 줄 (영문 italic 위 / 한국어 번역 아래)
 * — Hesya 핵심 차별점 시각 노출. data wire(DAL latest message translatedText
 * join)는 follow-up PR. 현재는 undefined → UI 미표시.
 */
export interface ConversationListItem extends Conversation {
  customerName: string | null;
  lastMessagePreviewKr?: string | null;
}

export type { WindowState, WindowStatus } from "./lib/window-utils";
